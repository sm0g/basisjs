module.exports = {
  name: 'basis.l10n',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var Dictionary = basis.require('basis.l10n').Dictionary;
    var Culture = basis.require('basis.l10n').Culture;
    var getDictionary = basis.require('basis.l10n').dictionary;
    var setCultureList = basis.require('basis.l10n').setCultureList;
    var setCulture = basis.require('basis.l10n').setCulture;
    var currentCulture = basis.require('basis.l10n').culture;
    var getCulture = basis.require('basis.l10n').getCulture;
  },

  test: [
    {
      name: 'fallback',
      test: [
        {
          name: 'basic',
          test: function(){
            var res = JSON.parse(basis.require('./fixture/dict.l10n').resource.get(true));
            var dict = getDictionary(basis.resource.virtual('l10n', res));
            setCulture('en-US');
            assert(dict.token('value').value === 'base');

            setCultureList('en-US a/b b/c c');

            setCulture('c');
            assert(dict.token('value').value === 'base');
            setCulture('b');
            assert(dict.token('value').value === 'base');
            setCulture('a');
            assert(dict.token('value').value === 'base');

            res.c = { value: 'c' };
            dict.resource.update(JSON.stringify(res));
            setCulture('c');
            assert(dict.token('value').value === 'c');

            setCulture('b');
            assert(dict.token('value').value === 'c');
            setCulture('a');
            assert(dict.token('value').value === 'c');

            res.b = { value: 'b' };
            dict.resource.update(JSON.stringify(res));
            assert(dict.token('value').value === 'b');
            setCulture('b');
            assert(dict.token('value').value === 'b');
            setCulture('c');
            assert(dict.token('value').value === 'c');

            res.a = { value: 'a' };
            dict.resource.update(JSON.stringify(res));
            setCulture('a');
            assert(dict.token('value').value === 'a');
            setCulture('b');
            assert(dict.token('value').value === 'b');
            setCulture('c');
            assert(dict.token('value').value === 'c');
          }
        }
      ]
    },
    {
      name: 'computeToken',
      test: [
        {
          name: 'base',
          sandbox: true,
          init: function(){
            var basis = window.basis.createSandbox();

            var getDictionary = basis.require('basis.l10n').dictionary;
            var setCultureList = basis.require('basis.l10n').setCultureList;
            var setCulture = basis.require('basis.l10n').setCulture;
            var currentCulture = basis.require('basis.l10n').culture;

            setCultureList('a');
            setCulture('a');
          },
          test: [
            {
              name: 'simple',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  a: {
                    token: {
                      foo: 'foo',
                      bar: 'bar'
                    }
                  }
                }));
                var token = dict.token('token').computeToken();
                var tokenCount = Object.keys(dict.tokens).length;

                // should not produce extra tokens in dictionary
                assert(token.get() === undefined);
                assert(Object.keys(dict.tokens).length == tokenCount);

                token.set('foo');
                assert(token.get() === 'foo');
                assert(Object.keys(dict.tokens).length == tokenCount);

                token.set('bar');
                assert(token.get() === 'bar');
                assert(Object.keys(dict.tokens).length == tokenCount);

                token.set('baz');
                assert(token.get() === undefined);
                assert(Object.keys(dict.tokens).length == tokenCount);
              }
            },
            {
              name: 'update on dictionary changes',
              test: function(){
                var data = {
                  a: {
                    token: {
                      foo: 'foo',
                      bar: 'bar'
                    }
                  }
                };
                var dict = getDictionary(basis.resource.virtual('l10n', data));
                var computeToken = dict.token('token').computeToken();

                assert(computeToken.get() === undefined);

                computeToken.set('foo');
                assert(computeToken.get() === 'foo');

                dict.resource.update({
                  a: {
                    token: {
                      foo: 'foo-2',
                      bar: 'bar-2'
                    }
                  }
                });
                assert(computeToken.get() === 'foo-2');

                computeToken.set('bar');
                assert(computeToken.get() === 'bar-2');

                dict.resource.update({
                  a: {
                    token: {}
                  }
                });
                assert(computeToken.get() === undefined);

                dict.resource.update({});
                assert(computeToken.get() === undefined);

                dict.resource.update({
                  a: {
                    token: {
                      bar: 'bar-3'
                    }
                  }
                });
                assert(computeToken.get() === 'bar-3');
              }
            }
          ]
        },
        {
          name: 'fallback',
          test: function(){
            setCultureList('a/b b');

            var dict = getDictionary(basis.resource.virtual('l10n', {
              a: {
                token: {
                  key1: 'a'
                }
              },
              b: {
                token: {
                  key1: 'b1',
                  key2: 'b2'
                }
              }
            }));
            var checkToken = dict.token('token').computeToken();

            // base culture A
            checkToken.set('key1');
            assert(getCulture() === 'a');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // set culture B
            setCulture('b');
            assert(getCulture() === 'b');
            assert(checkToken.get() === 'b2');

            checkToken.set('key1');
            assert(checkToken.get() === 'b1');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // set culture A
            setCulture('a');
            assert(getCulture() === 'a');
            assert(checkToken.get() === 'b2');

            checkToken.set('key1');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');
          }
        },
        {
          name: 'fallback on dictionary update',
          test: function(){
            setCultureList('a/b b');

            var data = {
              a: {
                token: {
                  key1: 'a'
                }
              },
              b: {
                token: {
                  key1: 'b1',
                  key2: 'b2'
                }
              }
            };
            var dict = getDictionary(basis.resource.virtual('l10n', data));
            var checkToken = dict.token('token').computeToken();

            // base culture A
            checkToken.set('key1');
            assert(getCulture() === 'a');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // update dict content
            dict.resource.update(basis.object.complete({
              b: {
                token: {
                  key1: 'b1-2',
                  key2: 'b2-2'
                }
              }
            }, data));

            assert(checkToken.get() === 'b2-2');

            checkToken.set('key1');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2-2');
          }
        }
      ]
    },
    {
      name: 'dictionary',
      test: function(){
        assert(getDictionary('./fixture/dict.l10n') === getDictionary('./fixture/dict.l10n'));
        assert(getDictionary(basis.resource('./fixture/dict.l10n')) === getDictionary('./fixture/dict.l10n'));

        // path should be normalized
        assert(getDictionary('./foo/../fixture/dict.l10n') === getDictionary('./fixture/dict.l10n'));
        // file extension should be replaced for `.l10n`
        assert(getDictionary('./fixture/dict.l10n') === getDictionary('./fixture/dict.whatever'));
        // if no extension, then `.l10n` should be appended
        assert(getDictionary('./fixture/dict.l10n') === getDictionary('./fixture/dict'));
      }
    },
    {
      name: 'dictionary from static data (experimental, under consideration)',
      test: function(){
        var staticdata = { 'ru-RU': { test: 'Test' } };
        var dict = getDictionary(staticdata);
        assert(dict instanceof Dictionary);

        // static data should produce the same dictionary (under consideration)
        assert(getDictionary(staticdata) !== getDictionary(staticdata));

        // check dictionary
        setCultureList('en-US ru-RU');

        setCulture('en-US');
        assert(dict.token('test').value === undefined);

        setCulture('ru-RU');
        assert(dict.token('test').value === 'Test');
      }
    },
    {
      name: 'culture/Culture',
      test: function(){
        setCultureList('en-US ru-RU');

        setCulture('en-US');
        assert(getCulture() === 'en-US');
        assert(currentCulture.value === 'en-US');
        assert(currentCulture.get() === 'en-US');
        assert(currentCulture().name === 'en-US');

        setCulture('ru-RU');
        assert(getCulture() === 'ru-RU');
        assert(currentCulture.value === 'ru-RU');
        assert(currentCulture.get() === 'ru-RU');
        assert(currentCulture().name === 'ru-RU');

        currentCulture.set('en-US');
        assert(getCulture() === 'en-US');
        assert(currentCulture.value === 'en-US');
        assert(currentCulture.get() === 'en-US');
        assert(currentCulture().name === 'en-US');

        // create culture
        assert((new Culture('en-US')).name === 'en-US');
        assert((new Culture('en-US')) !== (new Culture('en-US')));

        // culture helper
        assert(currentCulture('ru-RU') === currentCulture('ru-RU'));
        assert(currentCulture() === currentCulture(getCulture()));
        assert(currentCulture() instanceof Culture);
      }
    },
    {
      name: 'types',
      test: [
        {
          name: 'plural',
          test: [
            {
              name: 'simple',
              test: function(){
                var sandbox = basis.createSandbox({
                  name: 'types_plural_simple'
                });
                var l10n = sandbox.require('basis.l10n');

                l10n.setCultureList('en-US');
                var dict = l10n.dictionary(sandbox.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      foo: 'plural',
                      bar: 'plural'
                    }
                  },
                  'en-US': {
                    foo: [
                      'test',
                      'tests'
                    ],
                    bar: [
                      'example of # test',
                      'example of # tests'
                    ]
                  }
                }));

                assert(dict.token('foo').token(1).get() == 'test');
                assert(dict.token('foo').token(2).get() == 'tests');
                assert(dict.token('foo').computeToken(1).get() == 'test');
                assert(dict.token('foo').computeToken(2).get() == 'tests');
                assert(dict.token('bar').computeToken(1).get() == 'example of 1 test');
                assert(dict.token('bar').computeToken(2).get() == 'example of 2 tests');
              }
            }
          ]
        }
      ]
    }
  ]
};