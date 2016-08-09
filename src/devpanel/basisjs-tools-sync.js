var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisResource = inspectBasis.resource;
var Value = require('basis.data').Value;
var Dataset = require('basis.data').Dataset;
var File = require('type').File;
var api = require('./api/index.js');

var features = new basis.Token([]);
var isOnline = new Value({ value: false });
var remoteInspectors = new Value({
  value: 0,
  getRemoteUrl: String,
  send: function(){
    basis.dev.warn('[basis.devpanel] Can\'t send anything since remoteInspectors#send() is not inited yet');
  }
});
var permanentFilesChangedCount = new Value({ value: 0 });
var permanentFiles = [];
var notificationsQueue = [];

function getInspectorUIBundle(){
  basis.dev.warn('[basis.devpanel] Method to retrieve Remote Inspector UI bundle is not implemented');
}

function getInspectorUI(dev, callback){
  if (dev)
    return callback(null, 'url', basis.path.origin + basis.path.resolve(__dirname, 'standalone.html'));

  getInspectorUIBundle(dev, callback);
}

function processNotificationQueue(){
  // aggregate files changes
  Dataset.setAccumulateState(true);

  notificationsQueue.splice(0).forEach(function(notification){
    var action = notification.action;
    var filename = notification.filename;
    var content = notification.content;

    switch (action)
    {
      case 'new':
      case 'update':
        File({
          filename: filename,
          content: content
        });
        break;

      case 'remove':
        File(filename).destroy();
        break;
    }

    // permanent files changes
    if (action == 'new')
      return;

    // trace only update and delete
    var ext = basis.path.extname(filename);

    if (inspectBasisResource.extensions[ext] &&
        inspectBasisResource.extensions[ext].permanent &&
        inspectBasisResource.isResolved(filename) &&
        inspectBasisResource(filename).hasChanges())
      basis.array.add(permanentFiles, filename);
    else
      basis.array.remove(permanentFiles, filename);
  });

  // set new count
  permanentFilesChangedCount.set(permanentFiles.length);

  Dataset.setAccumulateState(false);
}


//
// init part
// run via basis.ready to ensure basisjsToolsFileSync is loaded
//
basis.ready(function(){
  function link(basisValue, btValue){
    btValue.attach(basisValue.set, basisValue);
    basisValue.set(btValue.value);
  }

  var basisjsTools = global.basisjsToolsFileSync;

  if (!basisjsTools)
  {
    basis.dev.warn('[basis.devpanel] basisjsToolsFileSync is not found');
    return;
  }


  // get ui method
  getInspectorUIBundle = function(dev, callback){
    basisjsTools.getBundle(dev ? asset('./standalone.html') : {
      build: asset('../../dist/devtool.js'),
      filename: asset('./standalone.html')
    }, function(err, script){
      callback(err, 'script', script);
    });
  };

  // sync files
  File.extendClass(function(super_, current_){
    return {
      init: function(){
        current_.init.apply(this, arguments);
        this.file = basisjsTools.getFile(this.data.filename, true);
      }
    };
  });
  File.all.set(basisjsTools.getFiles());

  // subscribe to files change notifications
  basisjsTools.notifications.attach(function(action, filename, content){
    if (!notificationsQueue.length)
      basis.nextTick(processNotificationQueue);

    notificationsQueue.push({
      action: action,
      filename: filename,
      content: content
    });
  });

  // sync isOnline
  link(isOnline, basisjsTools.isOnline);
  link(remoteInspectors, basisjsTools.remoteInspectors);

  File.open = basisjsTools.openFile;
  File.openFileSupported.set(typeof File.open == 'function'); // TODO: remove when basisjs-tools released with features
  File.getAppProfile = basisjsTools.getAppProfile;

  // sync features
  if (basisjsTools.features)
  {
    link(features, basisjsTools.features);
    link(File.openFileSupported, features.as(function(list){
      return list.indexOf('file:open') !== -1;
    }));
  }

  // initDevtool
  if (typeof basisjsTools.initRemoteDevtoolAPI === 'function')
  {
    var remoteApi = basisjsTools.initRemoteDevtoolAPI({
      getInspectorUI: getInspectorUI
    });

    // subscribe to data from remote devtool
    remoteApi.subscribe(function(command, callback){
      if (!api.ns(command.ns).hasOwnProperty(command.method))
        return console.warn('[basis.devpanel] Unknown devtool remote command:', command);

      api.ns(command.ns)[command.method].apply(null, command.args.concat(callback));
    });

    // context free send method
    remoteInspectors.send = function(){
      if (remoteInspectors.value > 0)
        remoteApi.send.apply(null, arguments);
    };

    remoteInspectors.getRemoteUrl = remoteApi.getRemoteUrl;
  }
});

module.exports = {
  isOnline: isOnline,
  remoteInspectors: remoteInspectors,
  getInspectorUI: getInspectorUI,
  permanentFilesChangedCount: permanentFilesChangedCount,
  File: File
};
