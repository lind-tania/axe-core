describe('DqElement', function() {
  'use strict';

  var DqElement = axe.utils.DqElement;
  var fixture = document.getElementById('fixture');
  var fixtureSetup = axe.testUtils.fixtureSetup;

  afterEach(function() {
    axe.reset();
  });

  it('should be a function', function() {
    assert.isFunction(DqElement);
  });

  it('should be exposed to utils', function() {
    assert.equal(axe.utils.DqElement, DqElement);
  });

  it('should take a node as a parameter and return an object', function() {
    var node = document.createElement('div');
    var result = new DqElement(node);

    assert.isObject(result);
  });
  describe('element', function() {
    it('should store reference to the element', function() {
      var div = document.createElement('div');
      var dqEl = new DqElement(div);
      assert.equal(dqEl.element, div);
    });

    it('should not be present in stringified version', function() {
      var div = document.createElement('div');
      fixtureSetup();

      var dqEl = new DqElement(div);

      assert.isUndefined(JSON.parse(JSON.stringify(dqEl)).element);
    });
  });

  describe('source', function() {
    it('should include the outerHTML of the element', function() {
      fixture.innerHTML = '<div class="bar" id="foo">Hello!</div>';

      var result = new DqElement(fixture.firstChild);
      assert.equal(result.source, fixture.firstChild.outerHTML);
    });

    it('should work with SVG elements', function() {
      fixture.innerHTML = '<svg aria-label="foo"></svg>';

      var result = new DqElement(fixture.firstChild);
      assert.isString(result.source);
    });
    it('should work with MathML', function() {
      fixture.innerHTML =
        '<math display="block"><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow></math>';

      var result = new DqElement(fixture.firstChild);
      assert.isString(result.source);
    });

    it('should truncate large elements', function() {
      var div = '<div class="foo" id="foo">';
      for (var i = 0; i < 300; i++) {
        div += i;
      }
      div += '</div>';
      fixture.innerHTML = div;

      var result = new DqElement(fixture.firstChild);
      assert.equal(result.source.length, '<div class="foo" id="foo">'.length);
    });

    it('should use spec object over passed element', function() {
      fixture.innerHTML = '<div id="foo" class="bar">Hello!</div>';
      var result = new DqElement(
        fixture.firstChild,
        {},
        {
          source: 'woot'
        }
      );
      assert.equal(result.source, 'woot');
    });

    it('should return null if audit.noHtml is set', function() {
      axe.configure({ noHtml: true });
      fixture.innerHTML = '<div class="bar" id="foo">Hello!</div>';
      var result = new DqElement(fixture.firstChild);
      assert.isNull(result.source);
    });

    it('should not use spec object over passed element if audit.noHtml is set', function() {
      axe.configure({ noHtml: true });
      fixture.innerHTML = '<div id="foo" class="bar">Hello!</div>';
      var result = new DqElement(
        fixture.firstChild,
        {},
        {
          source: 'woot'
        }
      );
      assert.isNull(result.source);
    });
  });

  describe('selector', function() {
    it('should prefer selector from spec object', function() {
      fixture.innerHTML = '<div id="foo" class="bar">Hello!</div>';
      var result = new DqElement(
        fixture.firstChild,
        {},
        {
          selector: 'woot'
        }
      );
      assert.equal(result.selector, 'woot');
    });
  });

  describe('ancestry', function() {
    it('should prefer selector from spec object', function() {
      fixture.innerHTML = '<div id="foo" class="bar">Hello!</div>';
      var result = new DqElement(
        fixture.firstChild,
        {},
        {
          ancestry: 'woot'
        }
      );
      assert.equal(result.ancestry, 'woot');
    });
  });

  describe('xpath', function() {
    it('should prefer selector from spec object', function() {
      fixture.innerHTML = '<div id="foo" class="bar">Hello!</div>';
      var result = new DqElement(
        fixture.firstChild,
        {},
        {
          xpath: 'woot'
        }
      );
      assert.equal(result.xpath, 'woot');
    });
  });

  describe('absolutePaths', function() {
    it('creates a path all the way to root', function() {
      fixtureSetup('<div id="foo" class="bar">Hello!</div>');

      var result = new DqElement(fixture.firstChild, {
        absolutePaths: true
      });
      assert.include(result.selector[0], 'html > ');
      assert.include(result.selector[0], '#fixture > ');
      assert.include(result.selector[0], '#foo');
    });
  });

  describe('toJSON', function() {
    it('should only stringify selector and source', function() {
      var expected = {
        selector: 'foo > bar > joe',
        source: '<joe aria-required="true">',
        xpath: '/foo/bar/joe',
        ancestry: 'foo > bar > joe'
      };
      var result = new DqElement('joe', {}, expected);

      assert.deepEqual(JSON.stringify(result), JSON.stringify(expected));
    });
  });

  describe('fromFrame', function() {
    var dqMain, dqIframe;
    beforeEach(function() {
      var main = document.createElement('main');
      main.id = 'main';
      dqMain = new DqElement(
        main,
        {},
        {
          selector: ['#main'],
          ancestry: ['html > body > main'],
          xpath: ['/main']
        }
      );

      var iframe = document.createElement('iframe');
      iframe.id = 'iframe';
      dqIframe = new DqElement(
        iframe,
        {},
        {
          selector: ['#iframe'],
          ancestry: ['html > body > iframe'],
          xpath: ['/iframe']
        }
      );
    });

    it('returns a new DqElement', function() {
      assert.instanceOf(DqElement.fromFrame(dqMain, {}, dqIframe), DqElement);
    });

    it('sets options for DqElement', function() {
      var options = { absolutePaths: true };
      var dqElm = DqElement.fromFrame(dqMain, options, dqIframe);
      assert.isTrue(dqElm._options.toRoot);
    });

    it('merges node and frame selectors', function() {
      var dqElm = DqElement.fromFrame(dqMain, {}, dqIframe);
      assert.deepEqual(dqElm.selector, [
        dqIframe.selector[0],
        dqMain.selector[0]
      ]);
      assert.deepEqual(dqElm.ancestry, [
        dqIframe.ancestry[0],
        dqMain.ancestry[0]
      ]);
      assert.deepEqual(dqElm.xpath, [dqIframe.xpath[0], dqMain.xpath[0]]);
    });
  });
});
