var DataObject = require('basis.data').Object;
var ReadOnlyDataset = require('basis.data').ReadOnlyDataset;

function range(start, end){
  var result = [];
  if (typeof start == 'number' && typeof end == 'number' && start <= end)
    for (var i = start; i <= end; i++)
      result.push(i);
  return result;
}

function generate(start, end){
  return range(start, end).map(function(val){
    return new DataObject({
      data: {
        value: val
      }
    });
  });
}

function cmpDS(set1, set2){
  if (set1 instanceof ReadOnlyDataset == false)
    return 'set1 is not an instance of basis.data.ReadOnlyDataset';
  if (set2 instanceof ReadOnlyDataset == false)
    return 'set2 is not an instance of basis.data.ReadOnlyDataset';

  var items1 = set1.getValues('basisObjectId').sort();
  var items2 = set2.getValues('basisObjectId').sort();

  if (items1.length != items2.length)
    return 'set1 has ' + items1.length + ' item(s), but set2 has ' + items2.length + ' item(s)';

  for (var i = 0; i < items1.length; i++)
    if (items1[i] !== items2[i])
      return 'item#' + i + ' in set1 is not equal to item#' + i + ' in set2';

  return false;
}

function checkValues(set, values){
  var items = set.getItems().map(function(item){
    return item.data.value;
  }).sort();

  values = basis.array.flatten(values.slice()).sort();

  if (items.length != values.length)
    return 'set has ' + items.length + ' item(s), but should has ' + values.length + ' item(s)';

  for (var i = 0; i < items.length; i++)
    if (items[i] !== values[i])
      return 'item#' + i + ' in set is not equal to item#' + i + ' in answer';

  return false;
}

module.exports = {
  range: range,
  generate: generate,
  cmpDS: cmpDS,
  checkValues: checkValues
};
