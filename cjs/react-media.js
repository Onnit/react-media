'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var PropTypes = require('prop-types');
var invariant = require('invariant');
var json2mq = require('json2mq');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var PropTypes__default = /*#__PURE__*/_interopDefaultLegacy(PropTypes);
var invariant__default = /*#__PURE__*/_interopDefaultLegacy(invariant);
var json2mq__default = /*#__PURE__*/_interopDefaultLegacy(json2mq);

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

var MediaQueryListener = /*#__PURE__*/function () {
  function MediaQueryListener(targetWindow, query, listener) {
    var _this = this;
    this.nativeMediaQueryList = targetWindow.matchMedia(query);
    this.active = true;
    // Safari doesn't clear up listener with removeListener
    // when the listener is already waiting in the event queue.
    // Having an active flag to make sure the listener is not called
    // after we removeListener.
    this.cancellableListener = function () {
      _this.matches = _this.nativeMediaQueryList.matches;
      if (_this.active) {
        listener.apply(void 0, arguments);
      }
    };
    this.nativeMediaQueryList.addListener(this.cancellableListener);
    this.matches = this.nativeMediaQueryList.matches;
  }
  var _proto = MediaQueryListener.prototype;
  _proto.cancel = function cancel() {
    this.active = false;
    this.nativeMediaQueryList.removeListener(this.cancellableListener);
  };
  return MediaQueryListener;
}();

var checkInvariants = function checkInvariants(_ref) {
  var query = _ref.query,
    queries = _ref.queries,
    defaultMatches = _ref.defaultMatches;
  !(!(!query && !queries) || query && queries) ? invariant__default["default"](false, '<Media> must be supplied with either "query" or "queries"')  : void 0;
  !(defaultMatches === undefined || !query || typeof defaultMatches === "boolean") ? invariant__default["default"](false, "<Media> when query is set, defaultMatches must be a boolean, received " + typeof defaultMatches)  : void 0;
  !(defaultMatches === undefined || !queries || typeof defaultMatches === "object") ? invariant__default["default"](false, "<Media> when queries is set, defaultMatches must be a object of booleans, received " + typeof defaultMatches)  : void 0;
};

/**
 * Wraps a single query in an object. This is used to provide backward compatibility with
 * the old `query` prop (as opposed to `queries`). If only a single query is passed, the object
 * will be unpacked down the line, but this allows our internals to assume an object of queries
 * at all times.
 */
var wrapInQueryObject = function wrapInQueryObject(query) {
  return {
    __DEFAULT__: query
  };
};

/**
 * Unwraps an object of queries, if it was originally passed as a single query.
 */
var unwrapSingleQuery = function unwrapSingleQuery(queryObject) {
  var queryNames = Object.keys(queryObject);
  if (queryNames.length === 1 && queryNames[0] === "__DEFAULT__") {
    return queryObject.__DEFAULT__;
  }
  return queryObject;
};
var useMedia = function useMedia(_ref2) {
  var query = _ref2.query,
    queries = _ref2.queries,
    defaultMatches = _ref2.defaultMatches,
    targetWindow = _ref2.targetWindow,
    onChange = _ref2.onChange;
  checkInvariants({
    query: query,
    queries: queries,
    defaultMatches: defaultMatches
  });
  var activeQueries = React.useRef([]);
  var getMatches = function getMatches() {
    var result = activeQueries.current.reduce(function (acc, _ref3) {
      var _extends2;
      var name = _ref3.name,
        mqListener = _ref3.mqListener;
      return _extends({}, acc, (_extends2 = {}, _extends2[name] = mqListener.matches, _extends2));
    }, {});

    // return result;
    return unwrapSingleQuery(result);
  };
  var updateMatches = function updateMatches() {
    setMatches(getMatches());
  };
  var setUpMQLs = function setUpMQLs() {
    var activeTargetWindow = targetWindow || window;
    !(typeof activeTargetWindow.matchMedia === "function") ? invariant__default["default"](false, "<Media targetWindow> does not support `matchMedia`.")  : void 0;
    var queryObject = queries || wrapInQueryObject(query);
    activeQueries.current = Object.keys(queryObject).map(function (name) {
      var currentQuery = queryObject[name];
      var qs = typeof currentQuery !== "string" ? json2mq__default["default"](currentQuery) : currentQuery;
      var mqListener = new MediaQueryListener(activeTargetWindow, qs, updateMatches);
      return {
        name: name,
        mqListener: mqListener
      };
    });
  };
  var _useState = React.useState(function () {
      // If props.defaultMatches has been set, ensure we trigger a two-pass render.
      // This is useful for SSR with mismatching defaultMatches vs actual matches from window.matchMedia
      // Details: https://github.com/ReactTraining/react-media/issues/81
      // TODO: figure out whether this is still technically a two-pass render.
      if (typeof window !== "object") {
        // In case we're rendering on the server, apply the default matches
        if (defaultMatches !== undefined) {
          return defaultMatches;
        }
        if (query) {
          return true;
        }
        /* if (props.queries) */
        return Object.keys(queries).reduce(function (acc, key) {
          var _extends3;
          return _extends({}, acc, (_extends3 = {}, _extends3[key] = true, _extends3));
        }, {});
      }
      // Else we'll use the state from the MQLs that were just set up.
      setUpMQLs();
      return getMatches();
    }),
    matches = _useState[0],
    setMatches = _useState[1];
  React.useEffect(
  // Because setup happens in the state constructor, cleanup is the only thing that
  // useEffect is responsible for.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function () {
    return function () {
      return activeQueries.current.forEach(function (_ref4) {
        var mqListener = _ref4.mqListener;
        return mqListener.cancel();
      });
    };
  }, []);
  React.useEffect(
  // Set up a separate listener for onChange since we ideally want to fire onChange
  // after flushes, rather than having to insert it synchronously before an update happens.
  function () {
    if (onChange) {
      onChange(matches);
    }
  }, [matches, onChange]);
  return matches;
};

/**
 * Conditionally renders based on whether or not a media query matches.
 */
var Media = function Media(_ref5) {
  var defaultMatches = _ref5.defaultMatches,
    query = _ref5.query,
    queries = _ref5.queries,
    render = _ref5.render,
    children = _ref5.children,
    targetWindow = _ref5.targetWindow,
    onChange = _ref5.onChange;
  var matches = useMedia({
    query: query,
    queries: queries,
    defaultMatches: defaultMatches,
    targetWindow: targetWindow,
    onChange: onChange
  });

  // render
  var isAnyMatches = typeof matches === "object" ? Object.keys(matches).some(function (key) {
    return matches[key];
  }) : matches;
  return render ? isAnyMatches ? render(matches) : null : children ? typeof children === "function" ? children(matches) : !Array.isArray(children) || children.length // Preact defaults to empty children array
  ? isAnyMatches
  // We have to check whether child is a composite component or not to decide should we
  // provide `matches` as a prop or not
  ? React__default["default"].Children.only(children) && typeof React__default["default"].Children.only(children).type === "string" ? React__default["default"].Children.only(children) : /*#__PURE__*/React__default["default"].cloneElement(React__default["default"].Children.only(children), {
    matches: matches
  }) : null : null : null;
};
var queryType = PropTypes__default["default"].oneOfType([PropTypes__default["default"].string, PropTypes__default["default"].object, PropTypes__default["default"].arrayOf(PropTypes__default["default"].object.isRequired)]);
Media.propTypes = {
  defaultMatches: PropTypes__default["default"].oneOfType([PropTypes__default["default"].bool, PropTypes__default["default"].objectOf(PropTypes__default["default"].bool)]),
  query: queryType,
  queries: PropTypes__default["default"].objectOf(queryType),
  render: PropTypes__default["default"].func,
  children: PropTypes__default["default"].oneOfType([PropTypes__default["default"].node, PropTypes__default["default"].func]),
  targetWindow: PropTypes__default["default"].object,
  onChange: PropTypes__default["default"].func
};

exports["default"] = Media;
exports.useMedia = useMedia;
