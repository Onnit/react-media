import _extends from '@babel/runtime/helpers/esm/extends';
import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import json2mq from 'json2mq';

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
  !(!(!query && !queries) || query && queries) ? process.env.NODE_ENV !== "production" ? invariant(false, '<Media> must be supplied with either "query" or "queries"') : invariant(false) : void 0;
  !(defaultMatches === undefined || !query || typeof defaultMatches === "boolean") ? process.env.NODE_ENV !== "production" ? invariant(false, "<Media> when query is set, defaultMatches must be a boolean, received " + typeof defaultMatches) : invariant(false) : void 0;
  !(defaultMatches === undefined || !queries || typeof defaultMatches === "object") ? process.env.NODE_ENV !== "production" ? invariant(false, "<Media> when queries is set, defaultMatches must be a object of booleans, received " + typeof defaultMatches) : invariant(false) : void 0;
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
  var activeQueries = useRef([]);
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
    !(typeof activeTargetWindow.matchMedia === "function") ? process.env.NODE_ENV !== "production" ? invariant(false, "<Media targetWindow> does not support `matchMedia`.") : invariant(false) : void 0;
    var queryObject = queries || wrapInQueryObject(query);
    activeQueries.current = Object.keys(queryObject).map(function (name) {
      var currentQuery = queryObject[name];
      var qs = typeof currentQuery !== "string" ? json2mq(currentQuery) : currentQuery;
      var mqListener = new MediaQueryListener(activeTargetWindow, qs, updateMatches);
      return {
        name: name,
        mqListener: mqListener
      };
    });
  };
  var _useState = useState(function () {
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
  useEffect(
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
  useEffect(
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
  ? React.Children.only(children) && typeof React.Children.only(children).type === "string" ? React.Children.only(children) : /*#__PURE__*/React.cloneElement(React.Children.only(children), {
    matches: matches
  }) : null : null : null;
};
var queryType = PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.arrayOf(PropTypes.object.isRequired)]);
Media.propTypes = {
  defaultMatches: PropTypes.oneOfType([PropTypes.bool, PropTypes.objectOf(PropTypes.bool)]),
  query: queryType,
  queries: PropTypes.objectOf(queryType),
  render: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  targetWindow: PropTypes.object,
  onChange: PropTypes.func
};

export { Media as default, useMedia };
