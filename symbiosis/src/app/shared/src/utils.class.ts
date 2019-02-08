import {isString} from 'underscore';

export class Utils {
  static vendorPrefixes = ['', 'webkit', 'moz', 'ms'];

  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static toCamelCase(...args) {
    let camelCaseStr = '';
    let firstWord = true;
    args.forEach((arg: string, index) => {
      if (arg.length > 0 && firstWord) {
        camelCaseStr += arg;
        firstWord = false;
      } else {
        camelCaseStr += Utils.capitalize(arg);
      }
    });
    return camelCaseStr;
  }

  static createDivEl(classList: Array<string>) {
    const node = document.createElement('div');
    classList.forEach((elClass) => {
      node.classList.add(elClass);
    });
    return node;
  }

  static elementIsVisible(el: HTMLElement) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  static getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static routeToRegExp(route: string) {
    const optionalParam = /\((.*?)\)/g,
      namedParam = /(\(\?)?:\w+/g,
      splatParam = /\*\w?/g,
      escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    if (!isString(route)) {
      throw new Error('The route ' + JSON.stringify(route) + 'has to be a URL');
    }

    route = route.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, function (match, optional) {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  }

  static executePromiseQueue(fns: Array<any>, args?: Array<any>, ctx?: any, rejectOnNonPromise?: boolean) {
    const executeQueue = (
      queueFns: Array<Function>,
      promiseContainer?: { resolve: Function, reject: Function, promise: Promise<any> },
      isError?: boolean,
      responseValue?: any) => {

      const queueFn = queueFns.shift();

      if (!promiseContainer) {
        promiseContainer = {promise: null, resolve: null, reject: null};
        promiseContainer.promise = new Promise((resolve, reject) => {
          promiseContainer.resolve = resolve;
          promiseContainer.reject = reject;
        });
      }

      if (!queueFn) {
        if (isError) {
          promiseContainer.reject(responseValue);
        } else {
          promiseContainer.resolve(responseValue);
        }
      } else {
        if (!args) {
          args = [];
        }
        let returnValue = queueFn.apply(ctx, args);
        if (!returnValue || !returnValue.then) {
          if (isError) {
            returnValue = Promise.reject();
          } else {
            returnValue = Promise.resolve();
          }
        }
        returnValue.then(
          (handlerResponse) => {
            executeQueue(queueFns, promiseContainer, false, handlerResponse);
          }, (handlerResponse) => {
            executeQueue(queueFns, promiseContainer, true, handlerResponse);
          });
      }

      return promiseContainer.promise;
    };

    return executeQueue(fns, null, rejectOnNonPromise);
  }
}
