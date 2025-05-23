# Javascript

## Promise题

### 题目1

```js
const promise = new Promise((resolve, reject) => {
  console.log(1);
  resolve('success')
  console.log(2);
});
promise.then(() => {
  console.log(3);
});
console.log(4);
```

过程分析：

- 从上至下，先遇到new Promise，执行其中的同步代码1
- 再遇到resolve('success')， 将promise的状态改为了resolved并且将值保存下来
- 继续执行同步代码2
- 跳出promise，往下执行，碰到promise.then这个微任务，将其加入微任务队列
- 执行同步代码4
- 本轮宏任务全部执行完毕，检查微任务队列，发现promise.then这个微任务且状态为resolved，执行它。

```js
结果：
1 2 4 3
```

### 题目2

```js
const promise = new Promise((resolve, reject) => {
  console.log(1);
  console.log(2);
});
promise.then(() => {
  console.log(3);
});
console.log(4);
```

- 在promise中并没有resolve或者reject
- 因此promise.then并不会执行，它只有在被改变了状态之后才会执行。

结果：
1 2 4

### 题目3

```js
const promise1 = new Promise((resolve, reject) => {
  console.log('promise1')
  resolve('resolve1')
})
const promise2 = promise1.then(res => {
  console.log(res)
})
console.log('1', promise1);
console.log('2', promise2);
```

过程分析：

- 从上至下，先遇到new Promise，执行该构造函数中的代码promise1
- 碰到resolve函数, 将promise1的状态改变为resolved, 并将结果保存下来
- 碰到promise1.then这个微任务，将它放入微任务队列
- promise2是一个新的状态为pending的Promise
- 执行同步代码1， 同时打印出promise1的状态是resolved
- 执行同步代码2，同时打印出promise2的状态是pending
- 宏任务执行完毕，查找微任务队列，发现promise1.then这个微任务且状态为resolved，执行它。

结果：

```js
'promise1'
'1' Promise{<resolved>: 'resolve1'}
'2' Promise{<pending>}
'resolve1'
```

### 题目4

```js
Promise.resolve().then(() => {
  console.log('promise1');
  const timer2 = setTimeout(() => {
    console.log('timer2')
  }, 0)
});
const timer1 = setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(() => {
    console.log('promise2')
  })
}, 0)
console.log('start');
```

- 刚开始整个脚本作为第一次宏任务来执行，我们将它标记为宏1，从上至下执行
- 遇到Promise.resolve().then这个微任务，将then中的内容加入第一次的微任务队列标记为微1
- 遇到定时器timer1，将它加入下一次宏任务的延迟列表，标记为宏2，等待执行(先不管里面是什么内容)
- 执行宏1中的同步代码start
- 第一次宏任务(宏1)执行完毕，检查第一次的微任务队列(微1)，发现有一个promise.then这个微任务需要执行
- 执行打印出微1中同步代码promise1，然后发现定时器timer2，将它加入宏2的后面，标记为宏3
- 第一次微任务队列(微1)执行完毕，执行第二次宏任务(宏2)，首先执行同步代码timer1
- 然后遇到了promise2这个微任务，将它加入此次循环的微任务队列，标记为微2
- 宏2中没有同步代码可执行了，查找本次循环的微任务队列(微2)，发现了promise2，执行它
- 第二轮执行完毕，执行宏3，打印出timer2

结果：

```js
'start'
'promise1'
'timer1'
'promise2'
'timer2'
```

### 题目5

封装一个异步加载图片的方法

```js
function loadImg (url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url
    img.onload = function () {
      resolve(img);
    }
    img.onerror = function () {
      reject(new Error("could not load image at" + url))
    }
  })
}
```

### 题目6

限制异步操作的并发个数并尽可能快的完成全部

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/2/28/1708b0d2d7baa165~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)

```js
function limitLoad(urls, handler, limit) {
  let sequence = [].concat(urls); // 复制urls
  // 这一步是为了初始化 promises 这个"容器"
  let promises = sequence.splice(0, limit).map((url, index) => {
    return handler(url).then(() => {
      // 返回下标是为了知道数组中是哪一项最先完成
      return index;
    });
  });
  // 注意这里要将整个变量过程返回，这样得到的就是一个Promise，可以在外面链式调用
  return sequence
    .reduce((pCollect, url) => {
      return pCollect
        .then(() => {
          return Promise.race(promises); // 返回已经完成的下标
        })
        .then(fastestIndex => { // 获取到已经完成的下标
         // 将"容器"内已经完成的那一项替换
          promises[fastestIndex] = handler(url).then(
            () => {
              return fastestIndex; // 要继续将这个下标返回，以便下一次变量
            }
          );
        })
        .catch(err => {
          console.error(err);
        });
    }, Promise.resolve()) // 初始化传入
    .then(() => { // 最后三个用.all来调用
      return Promise.all(promises);
    });
}
limitLoad(urls, loadImg, 3)
  .then(res => {
    console.log("图片全部加载完毕");
    console.log(res);
  })
  .catch(err => {
    console.error(err);
  });
```

### 题目7

实现mergePromise函数

这道题有点类似于Promise.all()，不过.all()不需要管执行顺序，只需要并发执行就行了。但是这里需要等上一个执行完毕之后才能执行下一个。

解题思路：

- 定义一个数组data用于保存所有异步操作的结果
- 初始化一个`const promise = Promise.resolve()`，然后循环遍历数组，在promise后面添加执行ajax任务，同时要将添加的结果重新赋值到promise上。

```js
function mergePromise (ajaxArray) {
  // 存放每个ajax的结果
  const data = [];
  let promise = Promise.resolve();
  ajaxArray.forEach(ajax => {
   // 第一次的then为了用来调用ajax
   // 第二次的then是为了获取ajax的结果
    promise = promise.then(ajax).then(res => {
      data.push(res);
      return data; // 把每次的结果返回
    })
  })
  // 最后得到的promise它的值就是data
  return promise;
}
```

### 题目8

使用Promise实现红绿灯交替重复亮

```js
function red() {
  console.log("red");
}
function green() {
  console.log("green");
}
function yellow() {
  console.log("yellow");
}
const light = function (timer, cb) {
  return new Promise(resolve => {
    setTimeout(() => {
      cb()
      resolve()
    }, timer)
  })
}
const step = function () {
  Promise.resolve().then(() => {
    return light(3000, red)
  }).then(() => {
    return light(2000, green)
  }).then(() => {
    return light(1000, yellow)
  }).then(() => {
    return step()
  })
}

step();
```

### 题目9

头条面试题

```js
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}

async function async2() {
  console.log("async2");
}

console.log("script start");

setTimeout(function() {
  console.log("setTimeout");
}, 0);

async1();

new Promise(function(resolve) {
  console.log("promise1");
  resolve();
}).then(function() {
  console.log("promise2");
});
console.log('script end')
```

```js
'script start'
'async1 start'
'async2'
'promise1'
'script end'
'async1 end'
'promise2'
'setTimeout'
```

### 题目10

```js
Promise.resolve(1)
  .then(res => {
    console.log(res);
    return 2;
  })
  .catch(err => {
    return 3;
  })
  .then(res => {
    console.log(res);
  });
```

- Promise可以链式调用，不过promise 每次调用 .then 或者 .catch 都会返回一个新的 promise，从而实现了链式调用, 它并不像一般我们任务的链式调用一样return this。
- 上面的输出结果之所以依次打印出1和2，那是因为resolve(1)之后走的是第一个then方法，并没有走catch里，所以第二个then中的res得到的实际上是第一个then的返回值。
且 return 2 会被包装成resolve(2)。

```js
const promise = new Promise((resolve, reject) => {
  reject("error");
  resolve("success2");
});
promise
.then(res => {
    console.log("then1: ", res);
  }).then(res => {
    console.log("then2: ", res);
  }).catch(err => {
    console.log("catch: ", err);
  }).then(res => {
    console.log("then3: ", res);
  })
```

- catch不管被连接到哪里，都能捕获上层未捕捉过的错误。

- 至于then3也会被执行，那是因为catch()也会返回一个Promise，且由于这个Promise没有返回值，所以打印出来的是undefined。

### 题目11

```js
Promise.reject(1)
  .then(res => {
    console.log(res);
    return 2;
  })
  .catch(err => {
    console.log(err);
    return 3
  })
  .then(res => {
    console.log(res);
  });
```

结果：

```js
1
3
```

## 手写 Promise

```js
/**
 * 在 myPromise.js 基础上，根据规范实现了 Promise 的全部方法：
 * - Promise.resolve()
 * - Promise.reject()
 * - Promise.prototype.catch()
 * - Promise.prototype.finally()
 * - Promise.all()
 * - Promise.allSettled()
 * - Promise.any()
 * - Promise.race()
 */
class myPromise {
    static PENDING = 'pending';
    static FULFILLED = 'fulfilled';
    static REJECTED = 'rejected';

    constructor(func) {
        this.PromiseState = myPromise.PENDING;
        this.PromiseResult = null;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];
        try {
            func(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
            this.reject(error)
        }
    }

    resolve(result) {
        if (this.PromiseState === myPromise.PENDING) {
            this.PromiseState = myPromise.FULFILLED;
            this.PromiseResult = result;
            this.onFulfilledCallbacks.forEach(callback => {
                callback(result)
            })
        }
    }

    reject(reason) {
        if (this.PromiseState === myPromise.PENDING) {
            this.PromiseState = myPromise.REJECTED;
            this.PromiseResult = reason;
            this.onRejectedCallbacks.forEach(callback => {
                callback(reason)
            })
        }
    }

    /**
     * [注册fulfilled状态/rejected状态对应的回调函数] 
     * @param {function} onFulfilled  fulfilled状态时 执行的函数
     * @param {function} onRejected  rejected状态时 执行的函数 
     * @returns {function} newPromsie  返回一个新的promise对象
     */
    then(onFulfilled, onRejected) {
        let promise2 = new myPromise((resolve, reject) => {
            if (this.PromiseState === myPromise.FULFILLED) {
                setTimeout(() => {
                    try {
                        if (typeof onFulfilled !== 'function') {
                            resolve(this.PromiseResult);
                        } else {
                            let x = onFulfilled(this.PromiseResult);
                            resolvePromise(promise2, x, resolve, reject);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            } else if (this.PromiseState === myPromise.REJECTED) {
                setTimeout(() => {
                    try {
                        if (typeof onRejected !== 'function') {
                            reject(this.PromiseResult);
                        } else {
                            let x = onRejected(this.PromiseResult);
                            resolvePromise(promise2, x, resolve, reject);
                        }
                    } catch (e) {
                        reject(e)
                    }
                });
            } else if (this.PromiseState === myPromise.PENDING) {
                this.onFulfilledCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            if (typeof onFulfilled !== 'function') {
                                resolve(this.PromiseResult);
                            } else {
                                let x = onFulfilled(this.PromiseResult);
                                resolvePromise(promise2, x, resolve, reject);
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            if (typeof onRejected !== 'function') {
                                reject(this.PromiseResult);
                            } else {
                                let x = onRejected(this.PromiseResult);
                                resolvePromise(promise2, x, resolve, reject);
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
            }
        })

        return promise2
    }

    /**
     * Promise.resolve()
     * @param {[type]} value 要解析为 Promise 对象的值 
     */
    static resolve(value) {
        // 如果这个值是一个 promise ，那么将返回这个 promise 
        if (value instanceof myPromise) {
            return value;
        } else if (value instanceof Object && 'then' in value) {
            // 如果这个值是thenable（即带有`"then" `方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态；
            return new myPromise((resolve, reject) => {
                value.then(resolve, reject);
            })
        }

        // 否则返回的promise将以此值完成，即以此值执行`resolve()`方法 (状态为fulfilled)
        return new myPromise((resolve) => {
            resolve(value)
        })
    }

    /**
     * Promise.reject()
     * @param {*} reason 表示Promise被拒绝的原因
     * @returns 
     */
    static reject(reason) {
        return new myPromise((resolve, reject) => {
            reject(reason);
        })
    }

    /**
     * Promise.prototype.catch()
     * @param {*} onRejected 
     * @returns 
     */
    catch (onRejected) {
        return this.then(undefined, onRejected)
    }

    /**
     * Promise.prototype.finally()
     * @param {*} callBack 无论结果是fulfilled或者是rejected，都会执行的回调函数
     * @returns 
     */
    finally(callBack) {
        return this.then(callBack, callBack)
    }

    /**
     * Promise.all()
     * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
     * @returns 
     */
    static all(promises) {
        return new myPromise((resolve, reject) => {
            // 参数校验
            if (Array.isArray(promises)) {
                let result = []; // 存储结果
                let count = 0; // 计数器

                // 如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状态的 Promise
                if (promises.length === 0) {
                    return resolve(promises);
                }

                promises.forEach((item, index) => {
                    // myPromise.resolve方法中已经判断了参数是否为promise与thenable对象，所以无需在该方法中再次判断
                    myPromise.resolve(item).then(
                        value => {
                            count++;
                            // 每个promise执行的结果存储在result中
                            result[index] = value;
                            // Promise.all 等待所有都完成（或第一个失败）
                            count === promises.length && resolve(result);
                        },
                        reason => {
                            /**
                             * 如果传入的 promise 中有一个失败（rejected），
                             * Promise.all 异步地将失败的那个结果给失败状态的回调函数，而不管其它 promise 是否完成
                             */
                            reject(reason);
                        }
                    )
                })
            } else {
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }

    /**
     * Promise.allSettled()
     * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
     * @returns 
     */
    static allSettled(promises) {
        return new myPromise((resolve, reject) => {
            // 参数校验
            if (Array.isArray(promises)) {
                let result = []; // 存储结果
                let count = 0; // 计数器

                // 如果传入的是一个空数组，那么就直接返回一个resolved的空数组promise对象
                if (promises.length === 0) return resolve(promises);

                promises.forEach((item, index) => {
                    // 非promise值，通过Promise.resolve转换为promise进行统一处理
                    myPromise.resolve(item).then(
                        value => {
                            count++;
                            // 对于每个结果对象，都有一个 status 字符串。如果它的值为 fulfilled，则结果对象上存在一个 value 。
                            result[index] = {
                                status: 'fulfilled',
                                value
                            }
                            // 所有给定的promise都已经fulfilled或rejected后,返回这个promise
                            count === promises.length && resolve(result);
                        },
                        reason => {
                            count++;
                            /**
                             * 对于每个结果对象，都有一个 status 字符串。如果值为 rejected，则存在一个 reason 。
                             * value（或 reason ）反映了每个 promise 决议（或拒绝）的值。
                             */
                            result[index] = {
                                status: 'rejected',
                                reason
                            }
                            // 所有给定的promise都已经fulfilled或rejected后,返回这个promise
                            count === promises.length && resolve(result);
                        }
                    )
                })
            } else {
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }

    /**
     * Promise.any()
     * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
     * @returns 
     */
    static any(promises) {
        return new myPromise((resolve, reject) => {
            // 参数校验
            if (Array.isArray(promises)) {
                let errors = []; // 
                let count = 0; // 计数器

                // 如果传入的参数是一个空的可迭代对象，则返回一个 已失败（already rejected） 状态的 Promise。
                if (promises.length === 0) return reject(new AggregateError([], 'All promises were rejected'));

                promises.forEach(item => {
                    // 非Promise值，通过Promise.resolve转换为Promise
                    myPromise.resolve(item).then(
                        value => {
                            // 只要其中的一个 promise 成功，就返回那个已经成功的 promise 
                            resolve(value);
                        },
                        reason => {
                            count++;
                            errors.push(reason);
                            /**
                             * 如果可迭代对象中没有一个 promise 成功，就返回一个失败的 promise 和AggregateError类型的实例，
                             * AggregateError是 Error 的一个子类，用于把单一的错误集合在一起。
                             */
                            count === promises.length && reject(new AggregateError(errors, 'All promises were rejected'));
                        }
                    )
                })
            } else {
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }

    /**
     * Promise.race()
     * @param {iterable} promises 可迭代对象，类似Array。详见 iterable。
     * @returns 
     */
    static race(promises) {
        return new myPromise((resolve, reject) => {
            // 参数校验
            if (Array.isArray(promises)) {
                // 如果传入的迭代promises是空的，则返回的 promise 将永远等待。
                if (promises.length > 0) {
                    promises.forEach(item => {
                        /**
                         * 如果迭代包含一个或多个非承诺值和/或已解决/拒绝的承诺，
                         * 则 Promise.race 将解析为迭代中找到的第一个值。
                         */
                        myPromise.resolve(item).then(resolve, reject);
                    })
                }
            } else {
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }
}

/**
 * 对resolve()、reject() 进行改造增强 针对resolve()和reject()中不同值情况 进行处理
 * @param  {promise} promise2 promise1.then方法返回的新的promise对象
 * @param  {[type]} x         promise1中onFulfilled或onRejected的返回值
 * @param  {[type]} resolve   promise2的resolve方法
 * @param  {[type]} reject    promise2的reject方法
 */
function resolvePromise(promise2, x, resolve, reject) {
    if (x === promise2) {
        throw new TypeError('Chaining cycle detected for promise');
    }

    if (x instanceof myPromise) {
        x.then(y => {
            resolvePromise(promise2, y, resolve, reject)
        }, reject);
    } else if (x !== null && ((typeof x === 'object' || (typeof x === 'function')))) {
        try {
            var then = x.then;
        } catch (e) {
            return reject(e);
        }

        if (typeof then === 'function') {
            let called = false;
            try {
                then.call(
                    x,
                    y => {
                        if (called) return;
                        called = true;
                        resolvePromise(promise2, y, resolve, reject);
                    },
                    r => {
                        if (called) return;
                        called = true;
                        reject(r);
                    }
                )
            } catch (e) {
                if (called) return;
                called = true;

                reject(e);
            }
        } else {
            resolve(x);
        }
    } else {
        return resolve(x);
    }
}

myPromise.deferred = function () {
    let result = {};
    result.promise = new myPromise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
}

module.exports = myPromise;
```

## 实现一个函数，判断输入是不是回文字符串

```js
function isPalindrome(str) {
  if (typeof str !== 'string') {
    return false
  }
  return str.split().reverse().join() === str;
}
```

## 说说事件流

- 事件流分为两种，捕获事件流和冒泡事件流。
- 捕获事件流从根节点开始执行，一直往子节点查找执行，直到查找执行到目标节点。
- 冒泡事件流从目标节点开始执行，一直往父节点冒泡查找执行，直到查到到根节点。
- DOM事件流分为三个阶段，一个是捕获节点，一个是处于目标节点阶段，一个是冒泡阶段。

## 算法题

现在有一个数组[1,2,3,4]，请实现算法，得到这个数组的全排列的数组，如[2,1,3,4]，[2,1,4,3]。。。。你这个算法的时间复杂度是多少

## 什么是深拷贝什么是浅拷贝？

浅拷贝只复制指向某个对象的指针，而不复制对象本身，新旧对象还是共享同一块内存。但深拷贝会另外创造一个一模一样的对象，新对象跟原对象不共享内存，修改新对象不会改到原对象。

浅拷贝：直接赋值、`Object.assign()`, `lodash的_.clone`, 扩展运算符…, concat，slice
深拷贝：`JSON.parse(JSON.stringify())`，`_.cloneDeep()`

```js
JSON.parse(JSON.stringify(object))
```

但是该方法有以下几个问题：

1. 会忽略 undefined
2. 会忽略 symbol
3. 不能序列化函数
4. 不能解决循环引用的对象
5. 不能正确的处理 new Date()，会调用 toISOString 方法转成字符串
6. 不能处理正则

```js
function deepClone(obj) {
  var result = Array.isArray(obj) ? [] : {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key]!==null) {
        result[key] = deepClone(obj[key]); 
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}
```

## 防抖 & 节流

```js
// 防抖
function debounce(fn,time){
  let timer = null;
  return function(){
    if(timer){
      clearTimeout(timer)
    }
    timer = setTimeout(()=>{
      fn.apply(this,arguments)
    },time)
  }
}
// 节流
function throttle(fn,time){
  let canRun = true;
  return function(){
    if(!canRun){
      return
    }
    canRun = false;
    setTimeout(() => {
      fn.apply(this,arguments);
      canRun = true;
    },time)
  }
}

```

## 数组乱序

```js
// 取巧的一种算法，但是每个位置乱序的概率不同
function mixArr(arr){
    return arr.sort(() => {
        return Math.random() - 0.5;
    })
}

//  著名的Fisher–Yates shuffle 洗牌算法
function shuffle(arr){
    let m = arr.length;
    while(m > 1){
        let index = parseInt(Math.random() * m--);
        [arr[index],arr[m]] = [arr[m],arr[index]];
    }
    return arr;
}
```

## 数组去重

```js
function removeDup(arr){
    var result = [];
    var hashMap = {};
    for(var i = 0; i < arr.length; i++){
        var temp = arr[i]
        if(!hashMap[temp]){
            hashMap[temp] = true
            result.push(temp)
        }
    }
    return result;
}

Array.from(new Set(arr))

[...new Set(arr)]
```

## 数组展平

```js
//展平多层
function flattenByDeep(array,deep){
    var result = [];
    for(var i = 0 ; i < array.length; i++){
        if(Array.isArray(array[i]) && deep >= 1){
              result = result.concat(flattenByDeep(array[i],deep -1))
        }else{
              result.push(array[i])
        }
    }
    return result;
}
```

## this

- this出现在全局函数中,永远指向window
- this出现在严格模式中 永远不会指向window, undefined
- 当某个函数为对象的一个属性时，在这个函数内部this指向这个对象
- this出现在构造函数中，指向构造函数新创建的对象
- 当一个元素被绑定事件处理函数时，this指向被点击的这个元素
- this出现在箭头函数中时，this和父级作用域的this指向相同

## 手写 bind、apply、call

```js
Function.prototype.myCall = function(context){ 
    if(typeof this != 'function'){
        throw new TypeError('this is not a function')
    }
    context.fn = this;
    var arr = [];
    for(var i = 1; i< arguments.length; i++){
        arr.push('argument[' + i + ']')
    }
    var result = eval('context.fn(' +arr+ ')');
    delete context.fn;
    return result;
}

Function.prototype.myApply = function(context,arr){ 
    if(typeof this != 'function'){
        throw new TypeError('this is not a function')
    }
    context.fn = this;
    var result= [];
    if(!arr){
        result = context.fn()
    }else{
        var args = [];
        for(var i = 1; i< arr.length; i++){
            args.push('arr[' + i + ']')
        }
        result = eval('context.fn(' +args+ ')');
    }
    delete context.fn;
    return result;
}

Function.prototype.myBind = function(context){
    if(typeof this != 'function'){
        throw new TypeError('this is not a function')
    }
    var self = this;
    var args = Array.prototype.slice.call(arguments,1);
    var F = function(){};
    F.prototype = this.prototype;
    var bound = function(){
        var bindArgs = Array.prototype.slice.call(arguments);
        return self.apply(this instanceof F ? this: context, args.concat(bindArgs))
    };
    bound.prototype = new F();
    return bound;
}
```

## 箭头函数和普通函数有什么区别？

1、语法更加简洁、清晰
2、箭头函数不会创建自己的this （它的this指向定义时外层执行环境的this，箭头函数中this的指向在它被定义的时候就已经确定了，之后永远不会改变。）
3、箭头函数继承而来的this指向永远不变
4、.call()/.apply()/.bind()无法改变箭头函数中this的指向
5、箭头函数不能作为构造函数使用
6、箭头函数没有自己的arguments
7、箭头函数没有原型prototype

## 什么是原型，什么是原型链？

构造函数的 prototype 指向原型对象，原型对象有一个 constructor 属性指回构造函数，每个构造函数生成的实例对象都有一个 proto 属性，这个属性指向原型对象。

## New操作符做了哪些事情？

1.先创建了一个空的对象
2.链接该对象到另一个对象上（将该对象的_proto_指向构造函数的的prototype）
3.把创建的obj作为this的上下文
4.判断构造函数的返回值

手写 new

```js
function myNew (Constr, ...args) {
    // 创建对象
    const obj = {};
    // 链接对象
    obj._proto_ = Constr.prototype;
    // 绑定this
    let res = Constr.call(obj,     ...args);
    // 判断返回类型
    return res instanceof Object ? res : obj;
}
```

## 说一下eventloop

事件循环事是 js 实现异步的一种方法，也是 js 的执行机制。首先浏览器会把主任务队列中的同步任务挨个执行，然后去执行微任务，微任务执行完再去执行下一次宏任务，如此循环，这种循环叫做事件循环。

浏览器环境下，js引擎维护两种任务，macroTask和microTask

1. 宏任务：script(整体代码)、setTimeout、I/O操作、setInterval、setImmediate、requestAnimationFrame
2. 微任务：Promise.then catch finally、process.nextTick、MutationObserver

Js会先执行同步任务、执行完同步再把异步任务入栈、然后执行微任务、宏任务

注意：async 底层也是 promise

```js
async function a () {
    Await b();
    console.log(1)
}
```

相当于：

```js
Function a () {
    Return new Promise((resolve, reject) => {
        Resolve(b())
    }).then(() => console.log(1))
}
```

优先级

- setTimeout = setInterval 一个队列
- setTimeout > setImmediate
- process.nextTick > Promise

## 什么是闭包，闭包的作用

概念：在《你不知道的JavaScript》上卷中明确对闭包的概念：当函数可以记住并访问所在的词法作用域，即使函数是在当前词法作用域之外执行，这时就产生了闭包。

举个例子：

```js
function demo() {
    const a = 1;
    return function () {
        return a;
    }
}
const a = demo();
console.log(a());
```

闭包的作用：

- 模拟私有方法，JavaScript 并没有原生的私有方法，可以通过闭包来模拟, 也叫模块模式

```js
function demo () {
    Function a() {}
    Return {
        A: function() {
            a();
        }
    }
}
```

## promise是什么？

定义：promise 表示一个异步操作的最终结果，是异步编程的一种解决方案，有效解决回调地狱的问题

1.promise 存在三种不同的状态

- pending
- resolved
- rejected

2.promise 的原型对象上有3个方法：

- then
- catch
- finally

3.Promise 构造函数上对外暴露6种方法

- all
- race
- allSettled
- any
- resolve
- reject
- try

## set和map有什么区别？

1. 初始化需要的值不一样，Map需要的是一个二维数组，而Set 需要的是一维 Array 数组
2. Map 和 Set 都不允许键重复
3. Map的键是不能修改，但是键对应的值是可以修改的；Set不能通过迭代器来改变Set的值，因为Set的值就是键。
4. Map 是键值对的存在，值也不作为健；而 Set 没有 value 只有 key，value 就是 key；

## for、map和forEach有什么区别

forEach 是遍历，map 是映射
forEach 没有返回值，map 有返回值
for 可以break, forEach不可以break

## Loader和Plugin 有什么区别?

loader是一个转换器，将A文件进行编译成B文件，比
如: 将A.less转换为A.css，单纯的文件转换过程。

plugin是一个扩展器，它丰富了webpack本身，针对是loader结束后，webpack打包的整个过程，它并不是直接操作文件，而是基于事件机制工作，会监听webpack打包过程中的某些节点，执行广泛的任务。

## 在地址栏里输入一个地址回车会发生哪些事情

1、解析URL：首先会对 URL 进行解析，分析所需要使用的传输协议和请求的资源的路径。如果输入的 URL 中的协议或者主机名不合法，将会把地址栏中输入的内容传递给搜索引擎。如果没有问题，浏览器会检查 URL 中是否出现了非法字符，如果存在非法字符，则对非法字符进行转义后再进行下一过程。

2、缓存判断：浏览器会判断所请求的资源是否在缓存里，如果请求的资源在缓存里并且没有失效，那么就直接使用，否则向服务器发起新的请求。

3、DNS解析： 下一步首先需要获取的是输入的 URL 中的域名的 IP 地址，首先会判断本地是否有该域名的 IP 地址的缓存，如果有则使用，如果没有则向本地 DNS 服务器发起请求。本地 DNS 服务器也会先检查是否存在缓存，如果没有就会先向根域名服务器发起请求，获得负责的顶级域名服务器的地址后，再向顶级域名服务器请求，然后获得负责的权威域名服务器的地址后，再向权威域名服务器发起请求，最终获得域名的 IP 地址后，本地 DNS 服务器再将这个 IP 地址返回给请求的用户。用户向本地 DNS 服务器发起请求属于递归请求，本地 DNS 服务器向各级域名服务器发起请求属于迭代请求。

4、获取MAC地址： 当浏览器得到 IP 地址后，数据传输还需要知道目的主机 MAC 地址，因为应用层下发数据给传输层，TCP 协议会指定源端口号和目的端口号，然后下发给网络层。网络层会将本机地址作为源地址，获取的 IP 地址作为目的地址。然后将下发给数据链路层，数据链路层的发送需要加入通信双方的 MAC 地址，本机的 MAC 地址作为源 MAC 地址，目的 MAC 地址需要分情况处理。通过将 IP 地址与本机的子网掩码相与，可以判断是否与请求主机在同一个子网里，如果在同一个子网里，可以使用 APR 协议获取到目的主机的 MAC 地址，如果不在一个子网里，那么请求应该转发给网关，由它代为转发，此时同样可以通过 ARP 协议来获取网关的 MAC 地址，此时目的主机的 MAC 地址应该为网关的地址。

5、TCP三次握手： 下面是 TCP 建立连接的三次握手的过程，首先客户端向服务器发送一个 SYN 连接请求报文段和一个随机序号，服务端接收到请求后向客户端发送一个 SYN ACK报文段，确认连接请求，并且也向客户端发送一个随机序号。客户端接收服务器的确认应答后，进入连接建立的状态，同时向服务器也发送一个ACK 确认报文段，服务器端接收到确认后，也进入连接建立状态，此时双方的连接就建立起来了。

6、HTTPS握手： 如果使用的是 HTTPS 协议，在通信前还存在 TLS 的一个四次握手的过程。首先由客户端向服务器端发送使用的协议的版本号、一个随机数和可以使用的加密方法。服务器端收到后，确认加密的方法，也向客户端发送一个随机数和自己的数字证书。客户端收到后，首先检查数字证书是否有效，如果有效，则再生成一个随机数，并使用证书中的公钥对随机数加密，然后发送给服务器端，并且还会提供一个前面所有内容的 hash 值供服务器端检验。服务器端接收后，使用自己的私钥对数据解密，同时向客户端发送一个前面所有内容的 hash 值供客户端检验。这个时候双方都有了三个随机数，按照之前所约定的加密方法，使用这三个随机数生成一把秘钥，以后双方通信前，就使用这个秘钥对数据进行加密后再传输。

7、返回数据： 当页面请求发送到服务器端后，服务器端会返回一个 html 文件作为响应，浏览器接收到响应后，开始对 html 文件进行解析，开始页面的渲染过程。

8、页面渲染： 浏览器首先会根据 html 文件构建 DOM 树，根据解析到的 css 文件构建 CSSOM 树，如果遇到 script 标签，则判端是否含有 defer 或者 async 属性，要不然 script 的加载和执行会造成页面的渲染的阻塞。当 DOM 树和 CSSOM 树建立好后，根据它们来构建渲染树。渲染树构建好后，会根据渲染树来进行布局。布局完成后，最后使用浏览器的 UI 接口对页面进行绘制。这个时候整个页面就显示出来了。

9、TCP四次挥手： 最后一步是 TCP 断开连接的四次挥手过程。若客户端认为数据发送完成，则它需要向服务端发送连接释放请求。服务端收到连接释放请求后，会告诉应用层要释放 TCP 链接。然后会发送 ACK 包，并进入 CLOSE_WAIT 状态，此时表明客户端到服务端的连接已经释放，不再接收客户端发的数据了。但是因为 TCP 连接是双向的，所以服务端仍旧可以发送数据给客户端。服务端如果此时还有没发完的数据会继续发送，完毕后会向客户端发送连接释放请求，然后服务端便进入 LAST-ACK 状态。客户端收到释放请求后，向服务端发送确认应答，此时客户端进入 TIME-WAIT 状态。该状态会持续 2MSL（最大段生存期，指报文段在网络中生存的时间，超时会被抛弃） 时间，若该时间段内没有服务端的重发请求的话，就进入 CLOSED 状态。当服务端收到确认应答后，也便进入 CLOSED 状态。

## 重绘和重排?

常见的引起重排属性和方法
任何会改变元素的位置和尺寸大小的操作，都会触发重排。常见的例子如下：

- 添加或删除可见的DOM元素
- 元素尺寸改变
- 内容变化，比如在input框中输入文字
- 浏览器窗口尺寸改变
- 计算offsetTop、offsetLeft等布局信息
- 设置style属性的值
- 激活CSS伪类，例如 :hover
- 查询某些属性或调用某些方法

```js
offsetTop、offsetLeft、offsetWidth、offsetHeight
scrollTop、scrollLeft、scrollWidth、scrollHeight
clientTop、clientLeft、clientWidth、clientHeight
getComputedStyle()
getBoundingClientRect()
```

## Es6常见的语法你知道哪一些?

## 说一下slice splice split 的区别?

## 说一下怎么把类数组转换为数组?

类数组：

- arguments
- 利用`querySelectorAll`、`getElementsByName`获取到的NodeList，利用`getElementsByTagName`、`getElementsByClassName`获取到的HTMLCollection

区别：
类数组上多了一个callee属性，数组上并不存在, 返回正被执行的Function对象
类数组不能调用数组的方法, 原型链上没有 Array.prototype

- Array.prototype.slice.call(arguments)
- Array.from(arguments);
- [...arguments]
- 也可以直接在函数接受参数时使用：`function fn(...args) {}` 此时在函数内部args就是一个数组了

:::tip
类数组上多了一个callee属性，数组上并不存在, 返回正被执行的Function对象,
借用arguments.callee来让匿名函数实现递归:

```js
let sum = function (n) {
    if (n == 1) {
        return 1;
    } else {
        return n + arguments.callee(n - 1); // 5 4 3 2 1
    }
}
```

:::

## 说一下数组如何去重,你有几种方法?

```js
// 第一种 不能检测 对象
[...new Set(array)];

// 第二种 这个有问题：不能检测 NaN 和 对象
function unique(array) {
  var result = [];
  for (var i = 0; i < array.length; i++) {
    if (result.indexOf(array[i]) === -1) {
      //如 result 中没有 arry[i],则添加到数组中
      result.push(array[i])
    }
  }
  return result;
}

// 第三种 不能检测 对象
function unique(array) {
  var result = [];
  for (var i = 0; i < array.length; i++) {
    if (result.includes(array[i])) {
      //如 result 中没有 arry[i],则添加到数组中
      result.push(array[i])
    }
  }
  return result;
}

// 第四种 Map

function arrayNonRepeatfy(arr) {
  let hashMap = new Map();
  let result = new Array();  // 数组用于返回结果
  for (let i = 0; i < arr.length; i++) {
    if(hashMap.has(arr[i])) { // 判断 hashMap 中是否已有该 key 值
      hashMap.set(arr[i], true);  // 后面的true 代表该 key 值在原始数组中重复了，false反之
    } else {  // 如果 hashMap 中没有该 key 值，添加
      hashMap.set(arr[i], false);  
      result.push(arr[i]);
    }
  } 
  return result;
}

```

## 说一下JSON.stringify有什么缺点？

- undefined、任意的函数以及 symbol 值，在序列化过程中会被忽略
- Date 日期调用了 toJSON() 将其转换为了 string 字符串（Date.toISOString()），因此会被当做字符串处理。
- NaN 和 Infinity 格式的数值及 null 都会被当做 null。
- 其他类型的对象，包括 Map/Set/WeakMap/WeakSet，仅会序列化可枚举的属性。

- JSON.stringify(value[, replacer [, space]])
  - replacer 可选
    - 如果该参数是一个函数，则在序列化过程中，被序列化的值的每个属性都会经过该函数的转换和处理;
    - 如果该参数是一个数组，则只有包含在这个数组中的属性名才会被序列化到最终的 JSON 字符串中;
    - 如果该参数为 null 或者未提供，则对象所有的属性都会被序列化;
  - space 缩进
  
## 说一下for...in 和 for...of的区别?

- for...in 遍历得到 key

- for...of 遍历得到 value
- 遍历对象：for...in可以，for...of 不可以
- 遍历Map Set: for..of 可以，for..in 不可以
- 遍历 generator：for...of 可以，for...in 不可以

- for...in可以用在可枚举的数据
- for...of用于可迭代的数据

## 实现一个批量请求函数, 能够限制并发量?

```js
class FetchWithLimits {
  constructor(limit) {
    this.tasks = [];
    this.limit = limit;
    this.workingNum = 0;
  }
  addTask(task) {
    this.tasks.push(task)
  }
  start() {
    for(let i = 0; i < limit, i ++) {
      this.doNext();
    }
  }
  doNext() {
    if (this.tasks.length < limit) {
      this.workingNum++;
      this.tasks.shift()().then(() => {
        this.workingNum --;
        this.doNext();
      })
    }
  }
}

const getData = (url) => new Promise((resolve, reject) => {
  fetch(url).then(() => {
    resolve();
  })
})

const fetchWithLimits = new FetchWithLimits(2);

fetchWithLimits.addTask(() => { getData(url1) })
fetchWithLimits.addTask(() => { getData(url2) })
fetchWithLimits.addTask(() => { getData(url3) })

fetchWithLimits.start();
```

## 数组转树结构

```js
// 方法1
function arrayToTree(arr, pid) {
  return arr.filter(item => item.pid === pid).map(item => ({ ...item, children: arrayToTree(arr, item.id) }));
}
const data = arrayToTree(arr, 0);
console.log(JSON.stringify(data));
```

## 去除字符串中出现次数最少的字符，不改变原字符串的顺序

## 写出一个函数trans，将数字转换成汉语的输出，输入为不超过10000亿的数字

## 手写柯里化

柯里化是什么：是指这样一个函数，它接收函数 A，并且能返回一个新的函数，这个新的函数能够处理函数 A 的剩余参数

```js
function createCurry(func, args) {
    var argity = func.length;
    var args = args || [];
    return function () {
        var _args = [].slice.apply(arguments);
        args.push(..._args);
        if (args.length < argity) {
            return createCurry.call(this, func, args);
        }
        return func.apply(this, args);
    }
}
```

### 写一个 mySetInterVal(fn, a, b),每次间隔 a,a+b,a+2b,...,a+nb 的时间，然后写一个 myClear，停止上面的 mySetInterVal

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/7)

### 介绍防抖节流原理、区别以及应用，并用JavaScript进行实现

公司：滴滴、虎扑、挖财、58、头条

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/15)

### 对闭包的看法，为什么要用闭包？说一下闭包原理以及应用场景

公司：滴滴、携程、喜马拉雅、微医、蘑菇街、酷家乐、腾讯应用宝、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/17)

### 实现 lodash 的_.get

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/20)

### 实现 add(1)(2)(3)

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/21)

### 实现链式调用

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/22)

### 类数组和数组的区别，dom 的类数组如何转换成数组

公司：海康威视

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/24)

## 介绍下 promise 的特性、优缺点，内部是如何实现的，动手实现 Promise

公司：滴滴、头条、喜马拉雅、兑吧、寺库、百分点、58、安居客

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/29)

## 实现 Promise.all

```js
Promise.all = function (arr) {
  // 实现代码
};
```

公司：滴滴、头条、有赞、微医

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/30)

## 手写发布订阅

公司：滴滴、头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/34)

## 手写数组转树

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/35)

## 手写用 ES6proxy 如何实现 arr[-1] 的访问

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/36)

## 手写实现 Array.flat()

公司：滴滴、快手、携程

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/242)

## 大数计算如何实现

公司：洋葱学院

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/235)

## 什么是深拷贝，和浅拷贝有什么区别，动手实现一个深拷贝

公司：顺丰、新东方、高德、虎扑、微医、百分点、酷狗

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/903)

## 实现一个方法判断 html 中的标签是否闭合

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/234)

## 箭头函数和普通函数的区别

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/230)

## 写出输出结果

```js
function Foo() {
  getName = function () {
    alert(1);
  };
  return this;
}
var getName;
function getName() {
  alert(5);
}
Foo.getName = function () {
  alert(2);
};
Foo.prototype.getName = function () {
  alert(3);
};
getName = function () {
  alert(4);
};

Foo.getName(); // ？
getName(); // ？
Foo().getName(); // ？
getName(); // ？
new Foo.getName(); // ?
new Foo().getName(); // ?
new new Foo().getName(); // ？
```

公司：心娱

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/213)

## 手写 dom 操作，翻转 li 标签，如何处理更优

```js
/*
 *有下边这样的dom结构，现在可以获取到ul，要求翻转里边li标签，如何处理更优
 */
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>
```

公司：快手

分类：

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/211)

```js
// (1)拼接html字符串,然后一次性插入ul中
const oUl = document.getElementById('root');
const aLi = Array.from(oUl.getElementsByTagName('li'));
let str = '';
for (let index = aLi.length - 1; index >= 0; index--) {
    str += `<li>${aLi[index].innerHTML}</li>`;
}
oUl.innerHTML = str;

// (2)使用文档片段
function reverseChildNodes(node = document) {
    const frag = node.ownerDocument.createDocumentFragment();
    while(node.lastChild) {
        // 每次取出最后一个子节点也会将该节点从源节点中移除,并且更新lastChild
        frag.appendChild(node.lastChild);
    }
    // 将文档碎片直接插入到node节点下
    node.appendChild(frag);
}
const oUl = document.getElementById('root');
reverseChildNodes(oUl);
```

## 怎样判断一个对象是否是数组，如何处理类数组对象

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/210)

```js
// 展开运算符和Array.from()都可以将类数组转换成数组，也可以用for遍历

Array.isArray = Array.isArray || function (arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
};

```

## 是否了解 glob，glob 是如何处理文件的，业界是否还有其它解决方案

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/208)

## 随便打开一个网页，用 JavaScript 打印所有以 s 和 h 开头的标签，并计算出标签的种类

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/204)

```js
const tmp = new Set()
Array.prototype.slice.call(document.querySelectorAll("*")).forEach(v => {
    const tagName = v.tagName.toLowerCase()
    if (tagName[0] === 's' || tagName[0] === 'h') {
        tmp.add(v.tagName)
    }
})
console.log(tmp);
```

## `1000*1000` 的画布，上面有飞机、子弹，如何划分区域能够更有效的做碰撞检测，类似划分区域大小与碰撞检测效率的算法，说一下大致的思路

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/203)

## 移动设备安卓与 iOS 的软键盘弹出的处理方式有什么不同

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/202)

## iPhone 里面 Safari 上如果一个输入框 fixed 绝对定位在底部，当软键盘弹出的时候会有什么问题，如何解决

公司：快手

分类：JavaScript、Css

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/201)

## 给定一个数组，按找到每个元素右侧第一个比它大的数字，没有的话返回-1 规则返回一个数组

```js
/*
 *示例：
 *给定数组：[2,6,3,8,10,9]
 *返回数组：[6,8,8,10,-1,-1]
 */
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/199)

## 说一说 promise，有几个状态，通过 catch 捕获到 reject 之后，在 catch 后面还能继续执行 then 方法嘛，如果能执行执行的是第几个回调函数

公司：伴鱼、喜马拉雅

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/198)

## var、let、const 的区别

公司：伴鱼、百分点、心娱

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/197)

## 说一下 GC

公司：伴鱼

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/195)

## 如何实现按需加载

公司：伴鱼、腾讯应用宝

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/189)

## 讲一下 import 的原理，与 require 有什么不同

公司：伴鱼、腾讯应用宝

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/188)

## 请实现如下的函数

```js
/*
 可以批量请求数据，所有的 URL 地址在 urls 参数中，同时可以通过 max 参数控制请求的并发度，当所有请求结束之后，需要执行 callback 回调函数。发请求的函数可以直接使用 fetch 即可
*/
```

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/185)

## 是否用过 restful 接口，和其他风格的有什么区别

公司：边锋

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/175)

## 说一下 get、post、put 的区别

公司：边锋、虎扑、酷家乐、酷狗、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/174)

## 说一下对面向对象的理解，面向对象有什么好处

公司：边锋

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/173)

## 类设计：使用面相对象设计一个停车场管理系

```js
/*
 *题目要求
 *使用面相对象设计一个停车场管理系统，该停车场包含：
 * 1.停车位，用于停放车辆；
 * 2.停车位提示牌，用于展示剩余停车位；
 *可以丰富该系统的元素，给出类，类属性，类接口。
 */
```

公司：边锋

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/171)

## 实现输出一个十六进制的随机颜色(#af0128a)

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/170)

## 手写代码实现`kuai-shou-front-end=>KuaiShouFrontEnd`

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/168)

## 设计一个 Student 组件，实现输入姓名性别成绩（这三个必填），还有几个不是必填的属性，要设置默认值，点击弹出成绩

公司：老虎

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/163)

## 设计一个函数，奇数次执行的时候打印 1，偶数次执行的时候打印 2

公司：老虎

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/162)

## 实现 Promise.then

公司：高德、百分点

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/161)

## 平时在项目开发中都做过哪些前端性能优化

公司：阿里、顺丰、易车、有赞、挖财、喜马拉雅、兑吧、寺库、海康威视、道一云、58

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/160)

## 给定起止日期，返回中间的所有月份

```js
// 输入两个字符串 2018-08  2018-12
// 输出他们中间的月份 [2018-9,2018-10, 2018-11]
```

公司：顺丰

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/159)

## 按要求实现代码

```js
// 给两个数组 [A1,A2,B1,B2,C1,C2,D1,D2] [A,B,C,D]
// 输出 [A1,A2,A,B1,B2,B,C1,C2,C,D1,D2,D]
```

公司：顺丰

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/158)

## 用尽量短的代码实现一个 arrary 的链式操作，将数组中的大于 10 的值进行一个累加

公司：顺丰

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/156)

## 简单封装一个异步 fecth，使用 async await 的方式来使用

公司：顺丰

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/155)

## 请写一个函数，输出出多级嵌套结构的 Object 的所有 key 值

```js
var obj = {
  a: "12",
  b: "23",
  first: {
    c: "34",
    d: "45",
    second: { 3: "56", f: "67", three: { g: "78", h: "89", i: "90" } },
  },
};
// => [a,b,c,d,e,f,g,h,i]
```

公司：顺丰

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/152)

## 写出打印结果，并解释为什么

```js
var a = { k1: 1 };
var b = a;
a.k3 = a = { k2: 2 };
console.log(a); // ?
console.log(b); // ?
```

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/149)

## 动手实现一个 repeat 方法

```js
function repeat(func, times, wait) {
  // TODO
}
const repeatFunc = repeat(alert, 4, 3000);
// 调用这个 repeatFunc ("hellworld")，会alert4次 helloworld, 每次间隔3秒
```

公司：头条

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/148)

## setTimeout 有什么缺点，和 requestAnimationFrame 有什么区别

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/147)

## versions 是一个项目的版本号列表，因多人维护，不规则，动手实现一个版本号处理函数

```js
var versions = ["1.45.0", "1.5", "6", "3.3.3.3.3.3.3"];
// 要求从小到大排序，注意'1.45'比'1.5'大
function sortVersion(versions) {
  // TODO
}
// => ['1.5','1.45.0','3.3.3.3.3.3','6']
```

公司：头条

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/146)

## 实现一个多并发的请求

```js
let urls = ['http://dcdapp.com', …];
/*
 *实现一个方法，比如每次并发的执行三个请求，如果超时（timeout）就输入null，直到全部请求完
 *batchGet(urls, batchnum=3, timeout=3000);
 *urls是一个请求的数组，每一项是一个url
 *最后按照输入的顺序返回结果数组[]
*/
```

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/144)

## 写出代码执行结果

```js
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}
async function async2() {
  console.log("async2");
}
console.log("script start");
setTimeout(function () {
  console.log("setTimeout");
}, 0);
async1();
new Promise(function (resolve) {
  console.log("promise1");
  resolve();
}).then(function () {
  console.log("promise2");
});
console.log("scripts end");
// 写出代码执行完成打印的结果
```

公司：头条、网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/142)

## 按要求实现一个 sum 函数

```js
const a = sum(0); // => a === 0
const b = sum(1)(2); // => b === 3
const c = sum(4)(5); // c === 9
const k = sum(n1)...(nk) // k === n1 + n2 + ... + nk
```

公司：头条

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/141)

## 说一下 base64 的编码方式

公司：完美世界

分类：JavaScirpt

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/359)

## 改变 this 指向的方式都有哪些？

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/354)

## 说一下`module.exports`和`exports`的区别，`export`和`export default`的区别

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/350)

## number 为什么会出现精度损失，怎样避免

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/348)

## 实现一个函数将中文数字转成数字

公司：微软

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/343)

## 节流

公司：微软

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/342)

## 如何实现 5 秒自动刷新一次页面(具体都有什么方法 reload 之类的)

公司：易车

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/338)

## 都了解哪些 ES6、ES7 的新特性，箭头函数可以被 new 吗

公司：易车、脉脉、虎扑、喜马拉雅、百分点、海风教育、58

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/337)

## 说一下 JavaScript 继承都有哪些方法

公司：易车、脉脉、微医、海康威视

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/336)

## 已知函数 A，要求构造⼀个函数 B 继承 A

```js
function A(name) {
  this.name = name;
}
A.prototype.getName = function () {
  console.log(this.name);
};
```

公司：新东方

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/333)

## 数组和对象转换为字符串结果

```js
var arry = [];
var obj = {};
// arry,obj 转成字符串的结果是什么？
```

公司：新东方

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/332)

## 请写出以下代码的打印结果

```js
var a = {
  name: "A",
  fn() {
    console.log(this.name);
  },
};
a.fn();
a.fn.call({ name: "B" });
var fn1 = a.fn;
fn1();
// 写出打印结果
```

公司：新东方

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/331)

## 请写出以下代码的打印结果

```js
let int = 1;
setTimeout(function () {
  console.log(int);
  int = 2;
  new Promise((resolve, reject) => {
    resolve();
  }).then(function () {
    console.log(int);
    int = 7;
  });
  console.log(int);
});
int = 3;
console.log(int);
new Promise((resolve, reject) => {
  console.log(int);
  return resolve((int = 4));
}).then(function (res) {
  console.log(int);
  int = 5;
  setTimeout(function () {
    console.log(int);
    int = 8;
  }); 
  return false;
});
console.log(int);
// 写出打印结果
```

公司：新东方

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/330)

## 要求⽤不同⽅式对 A 进⾏改造实现 A.name 发⽣变化时⽴即执⾏ A.getName

```js
/*
 已知对象A = {name: 'sfd', getName: function(){console.log(this.name)}},
 现要求⽤不同⽅式对A进⾏改造实现A.name发⽣变化时⽴即执⾏A.getName
*/
```

公司：新东方

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/329)

## 修改以下代码，使得最后⼀⾏代码能够输出数字 0-9（最好能给多种答案）

```js
var arrys = [];
for (var i = 0; i < 10; i++) {
  arrys.push(function () {
    return i;
  });
}
arrys.forEach(function (fn) {
  console.log(fn());
}); //本⾏不能修改
```

公司：新东方

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/328)

## 请给出识别 Email 的正则表达式

公司：头条

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/325)

## 设计 AutoComplete 组件(又叫搜索组件、自动补全组件等)时，需要考虑什么问题？

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/324)

## 实现函数接受任意二叉树，求二叉树所有根到叶子路径组成的数字之和

```js
class TreeNode{
  value:number
  left?:TreeNode
  right?:TreeNode
}
function getPathSum(root){
  // your code
}
// 例子，一层二叉树如下定义，路径包括1 —> 2 ,1 -> 3
const node = new TreeNode();
node.value = 1;
node.left = new TreeNode();
node.left.value = 2;
node.right = new TreeNode();
node.right.value = 3;
getPathSum(node); // return 7 = (1+2) + (1+3)
```

公司：头条

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/323)

## 请写出一下代码的打印结果

```js
function a(obj) {
  obj.a = 2;
  obj = { a: 3 };
  return obj;
}
const obj = { a: 1 };
a(obj);
console.log(obj);
```

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/324)

## Promise 链式调用如何实现

公司：滴滴

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/319)

## 说一下对`BigInt`的理解，在什么场景下会使用

公司：滴滴、高德

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/318)

## null 是不是一个对象，如果是，如何判断一个对象是 null，不使用 JavaScript 提供的 api 如何进行判断

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/317)

## 说一下对于堆栈的理解

公司：滴滴、高德

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/)

## `[] == ![]`为什么

公司：高德

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/313)

## 如何把真实 dom 转变为虚拟 dom，代码实现一下

公司：高德

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/310)

## 说一下错误监控的实现，错误监控的正确使用方式，日志如何分等级

公司：高德

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/309)

## 请写出以下代码执行结果

```js
var a = { x: 1 };
var b = a;
a.x = a = { n: 1 };
console.log(a); // ?
console.log(b); // ?
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/303)

## 请写出以下代码执行结果

```js
Function.prototype.a = () = >{alert(1)}
Object.prototype.b = () = >{alert(2)}
function A(){};
const a = new A();
a.a();
a.b();
// 写出执行结果
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/302)

## 请写出以下代码执行结果

```js
let a = 0;
console.log(a);
console.log(b);
let b = 0;
console.log(c);
function c() {}
// 写出执行结果
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/301)

## 请写出以下代码执行结果

```js
var x = 10;
function a(y) {
  var x = 20;
  return b(y);
}
function b(y) {
  return x + y;
}
a(20);
// 写出执行结果
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/300)

## 请写出以下代码执行结果

```js
console.log(1);
setTimeout(() => {
  console.log(2);
});
process.nextTick(() => {
  console.log(3);
});
setImmediate(() => {
  console.log(4);
});
new Promise((resolve) => {
  console.log(5);
  resolve();
  console.log(6);
}).then(() => {
  console.log(7);
});
Promise.resolve().then(() => {
  console.log(8);
  process.nextTick(() => {
    console.log(9);
  });
});
// 写出执行结果
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/299)

## 请写出以下代码执行结果

```js
[1, 2, 3, 4, 5].map(parselnt);
// 写出执行结果
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/298)

## 请写出以下代码执行结果

```js
typeof typeof typeof [];
// 写出执行结果
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/297)

## 说一下什么是死锁

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/295)

## 实现以下代码

```js
function add() {
  // your code
}
function one() {
  // your code
}
function two() {
  // your code
}
console.log(add(one(two()))); //3
console.log(add(two(one()))); //3
```

公司：快手

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/294)

## 请实现一个 cacheRequest 方法，保证发出多次同一个 ajax 请求时都能拿到数据，而实际上只发出一次请求

公司：快手

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/293)

## 实现一个函数柯里化

公司：快手

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/292)

## 说一下对原型链的理解，画一个经典的原型链图示

公司：脉脉、兑吧、快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/279)

## 说一下 ajax/axios/fetch 的区别

公司：脉脉

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/277)

## 用 Promise 封装一个 ajax

公司：脉脉

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/276)

## 描述 DOM 事件捕获的具体流程

公司：自如

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/272)

## 请实现`$on,$emit`

公司：自如

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/269)

## 实现 bind 方法，不能使用 call、apply、bind

公司：自如、腾讯应用宝、快手

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/268)

```js
Function.prototype.bind = function(context){
    context.fn = this;
    eval('context.fn('+(arguments[1]||[]).toString()+')');
    delete context.fn;
}
```

## 手写实现 sleep 函数

公司：自如

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/267)

```js
function sleep(fn, delay, ...args) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = typeof fn === 'function' && fn.apply(this, args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}
```

## 用原生 js 实现自定义事件

公司：自如

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/258)

```js
// 创建
const myEvent = new Event('event_name') // 不能携带参数
const myEvent = new CustomEvent('event_name', params) // 可以携带参数

// 监听
target.addEventListener('event_name',fn)

// 触发
document.dispatchEvent(myEvent)
```

## 如何识别出字符串中的回车并进行换行？

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/257)

```js
str = str.replace(/[\r\n]/g, "<br />")
```

## 输入一个日期 返回几秒前、几小时前、几天前、几月前

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/255)

## 将 153812.7 转化为 153,812.7

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/244)

## 数组有哪些方法 讲讲区别跟使用场景

公司：掌门一对一

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/410)

## 讲一下函数式编程

公司：掌门一对一

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/408)

## promise 跟 async await 的区别，使用场景

公司：网易、虎扑、沪江

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/407)

## async、await 如何进行错误捕获

公司：虎扑

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/406)

## weak-Set、weak-Map 和 Set、Map 区别

公司：虎扑

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/399)

## valueOf 与 toString 的区别

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/395)

## 怎么判断是一个空对象

公司：菜鸟网络

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/392)

## 请写出下面代码的执行结果

```js
setTimeout(() => {
  console.log(0);
}, 0);
new Promise((res) => setTimeout(res, 0)).then(() => {
  console.log(1);
  setTimeout(() => {
    console.log(2);
  }, 0);
  new Promise((r = r())).then(() => {
    console.log(3);
  });
});
setTimeout(() => {
  console.log(4);
}, 0);
new Promise((res) => res()).then(() => {
  console.log(5);
});
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/391)

## 请写出下面代码的执行结果

```js
function Foo() {
  getName = function () {
    alert(1);
  };
  return this;
}
getName();
Foo.getName = function () {
  alert(2);
};
Foo.prototype.getName = function () {
  alert(3);
};
getName = function () {
  alert(4);
};

// 请写出下面的输出结果
getName();
Foo.getName();
new Foo().getName();
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/390)

## 请只用数组方法和 Math.random()在一条语句的情况下，实现生成给定位数的随机数组，例如生成 10 位随机数组[1.1,102.1,2,3,8,4,90,123,11,123],数组内数字随机生成

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/387)

## 实现一个 setter 方法

```js
let setter = function (conten, key, value) {
  // your code
};
let n = {
  a: {
    b: {
      c: { d: 1 },
      bx: { y: 1 },
    },
    ax: { y: 1 },
  },
};
// 修改值
setter(n, "a.b.c.d", 3);
console.log(n.a.b.c.d); //3
setter(n, "a.b.bx", 1);
console.log(n.b.bx); //1
```

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/386)

## setTimeout 与 setInterval 区别

公司：腾讯应用宝

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/384)

## 项目中如何应用数据结构

公司：挖财

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/382)

## 闭包的核心是什么

公司：寺库

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/378)

## 写出代码输出结果

```js
var fullname = "Test1";
var obj = {
  fullname: "Test2",
  prop: {
    fullname: "Test3",
    getFullname: function () {
      return this.fullname;
    },
  },
};
console.log(obj.prop.getFullname());
var test = obj.prop.getFullname;
console.log(test());
```

公司：心娱、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/376)

## 实现一个功能，发送请求 5s 时间后，如果没有数据返回，中断请求,提示错误

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/375)

## 什么是作用域链

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/374)

## 介绍事件冒泡、事件代理、事件捕获，以及它们的关系

公司：腾讯应用宝、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/373)

## for..of 和 for...in 是否可以直接遍历对象，为什么

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/372)

## 在 map 中和 for 中调用异步函数的区别

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/371)

## gennerator yield 的作用

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/370)

## promise 的状态有哪些

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/369)

## 在 ES6 中有哪些解决异步的方法

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/368)

## es6 类继承中 super 的作用

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/367)

## cros 的简单请求和复杂请求的区别

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/366)

## addEventListener 的第三个参数的作用

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/592)

## 获取 id 为 netease 节点下所有的 checkbox 子元素(不用框架，注意兼容)

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/590)

## 使用原型链如何实现继承

公司：腾讯应用宝、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/589)

## 如何获取一个对象的深度

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/588)

## reduce 函数的功能，如何实现的，动手实现一下

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/587)

## 说一下 splice 和 slice 的功能用法

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/586)

## 面向对象的三要素是啥？都是啥意思？

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/585)

## 函数中的 this 有几种

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/584)

## 如何同时获取 html 中的 h1,h2,h3,h4,h5,h6 中的内容

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/583)

## JavaScript 的执行流程

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/582)

## Promise.resolve(obj)，obj 有几种可能

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/581)

## 写出代码执行结果

```js
new Promise((resolve, reject) => {
  reject("1");
})
  .catch((e) => {
    console.log(1);
  })
  .then((res) => {
    console.log(2);
  });
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/580)

## nextTick 是在本次循环执行，还是在下次，setTimeout(() => {}, 0)呢？

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/579)

## 使用正则去掉 Dom 中的内联样式

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/570)

## 写一个匹配 ip 地址的正则

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/569)

## 写一个匹配 Html 标签的正则

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/568)

## IOC 是啥，应用场景是啥？

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/563)

## 写出代码执行的打印结果

```js
function a(obj) {
  obj.a = 2;
  obj = { a: 3 };
  return obj;
}
const obj = { a: 1 };
a(obj);
console.log(obj);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/561)

## 实现函数

```js
d1,,,
d2,,,
d3,,,

把上边的字符串输出1，2，3的和 //6
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/560)

## 怎么实现 this 对象的深拷贝

公司：阿里

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/539)

## 使用 canvas 绘图时如何组织成通用组件

公司：宝宝树

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/538)

## 表单可以跨域吗

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/537)

## 搜索请求如何处理？搜索请求中文如何请求？

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/536)

## 介绍观察者模式

公司：网易、海风教育

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/535)

## 介绍中介者模式

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/534)

## 观察者和订阅-发布的区别，各自用在哪里

公司：网易、有赞、微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/533)

## 通过什么做到并发请求

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/532)

## 介绍 service worker

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/530)

## 介绍事件代理以及优缺点，主要解决什么问题

公司：网易、沪江

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/526)

## 介绍下 this 的各种情况

公司：网易、蘑菇街

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/524)

## 前端如何控制管理路由

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/523)

## 使用路由时出现问题如何解决

公司：网易

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/522)

## JavaScript 异步解决方案的发展历程以及优缺点

公司：滴滴、挖财、宝宝树、海康威视

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/515)

## 介绍 AST（Abstract Syntax Tree）抽象语法树

公司：滴滴

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/530)

## 对 async、await 的理解，内部原理是怎样的？

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/499)

## == 和 ===的区别，什么情况下用相等==

公司：头条、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/496)

## bind、call、apply 的区别

公司：头条、挖财、饿了么、心娱

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/495)

## 介绍下原型链

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/494)

## 介绍暂时性死区

公司：有赞

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/488)

## ES6 中的 map 和原生的对象有什么区别

公司：有赞

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/487)

## 对纯函数的理解

公司：有赞

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/483)

## 介绍 JSX

公司：有赞

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/482)

## 如何设计一个 localStorage，保证数据的时效性

公司：有赞

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/477)

## 实现 sum 方法，使 sum(x)(y),sum(x,y)返回的结果相同

公司：有赞、网易、乘法云

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/475)

## 两个对象如何比较

公司：有赞

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/474)

## 说一下变量的作用域链

公司：挖财

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/473)

## 介绍 dom 树对比

公司：挖财

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/472)

## 如何设计状态树

公司：挖财

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/471)

## Ajax 发生跨域要设置什么（前端）

公司：沪江

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/462)

## 加上 CORS 之后从发起到请求正式成功的过程

公司：沪江

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/461)

## Async 里面有多个 await 请求，可以怎么优化

公司：沪江

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/460)

## JavaScript 变量类型分为几种，区别是什么

公司：沪江、酷狗

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/456)

## JavaScript 里垃圾回收机制是什么，常用的是哪种，怎么处理的

公司：沪江、寺库

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/455)

## ES5 和 ES6 有什么区别

公司：饿了么

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/448)

## 取数组的最大值（ES5、ES6）

公司：饿了么

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/447)

## some、every、find、filter、map、forEach 有什么区别

公司：饿了么

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/446)

## 页面上生成一万个 button，并且绑定事件，如何做（JS 原生操作 DOM）？循环绑定时的 index 是多少，为什么，怎么解决？

公司：饿了么

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/445)

## 页面上有一个 input，还有一个 p 标签，改变 input 后 p 标签就跟着变化，如何处理？监听 input 的哪个事件，在什么时候触发？

公司：饿了么

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/444)

## Promise 和 async/await，和 Callback 有什么区别

公司：携程、海风教育

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/442)

## 项目中对于用户体验做过什么优化

公司：喜马拉雅

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/436)

## 前后端通信使用什么方案

公司：喜马拉雅

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/434)

## RESTful 常用的 Method

公司：喜马拉雅

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/433)

## prototype 和proto区别

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/429)

## new 的实现原理，动手实现一个 new

公司：兑吧

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/428)

## 如何实现 H5 手机端的适配

公司：兑吧、网易、心娱

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/427)

## 如何去除 url 中的#号

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/423)

## base64 为什么能提升性能，缺点

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/421)

## 介绍 webp 这个图片文件格式

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/420)

## 异步请求，低版本 fetch 如何低版本适配

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/418)

## ajax 如何处理跨域？CORS 如何设置？

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/417)

## jsonp 为什么不支持 post 方法

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/416)

## 介绍 Immuable

公司：兑吧

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/415)

## 介绍 JS 全部数据类型，基本数据类型和引用数据类型的区别

公司：微医、玄武科技、快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/613)

## Array 是 Object 类型吗

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/612)

## 说一下栈和堆的区别，垃圾回收时栈和堆的区别

公司：微医、寺库

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/611)

## 数组里面有 10 万个数据，取第一个元素和第 10 万个元素的时间相差多少

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/610)

## Async/Await 怎么实现

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/609)

## JavaScript 为什么要区分微任务和宏任务

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/608)

## Promise 构造函数是同步还是异步执行，then 呢

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/607)

## JavaScript 执行过程分为哪些阶段

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/605)

## 词法作用域和 this 的区别

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/604)

## loadsh 深拷贝实现原理

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/603)

## ES6 中 let 块作用域是怎么实现的

公司：微医

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/602)

## formData 和原生的 ajax 有什么区别

公司：宝宝树

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/779)

## 介绍下表单提交，和 formData 有什么关系

公司：宝宝树

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/778)

## promise 如何实现 then 处理，动手实现 then

公司：宝宝树

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/775)

## 如何处理异常捕获

公司：海康威视

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/770)

## 项目如何管理模块

公司：海康威视

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/769)

## 尽可能多的写出判断数组的方法

公司：海康威视、新东方

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/768)

## 介绍 localstorage 的 api

公司：海康威视

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/767)

## 使用原型最大的好处

公司：蘑菇街

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/765)

## 单例、工厂、观察者项目中实际场景

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/763)

## 添加原生事件不移除为什么会内存泄露，还有哪些地方会存在内存泄漏

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/762)

## setInterval 需要注意的点

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/761)

## 定时器为什么是不精确的

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/760)

## setTimeout(1)和 setTimeout(2)之间的区别

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/759)

## 介绍宏任务和微任务

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/758)

## promise 里面和 then 里面执行有什么区别

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/757)

## 介绍 class 和 ES5 的类以及区别

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/755)

## 介绍 defineProperty 方法，什么时候需要用到

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/754)

## for..in 和 object.keys 的区别

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/753)

## 使用闭包特权函数的使用场景

公司：酷家乐

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/752)

## JavaScript 是什么范式语言

公司：海风教育

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/743)

## Promise 有没有解决异步的问题

公司：海风教育

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/742)

## Promise 和 setTimeout 的区别

公司：海风教育

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/741)

## 按照调用实例，实现下面的 Person 方法

```js
Person("Li");
// 输出： Hi! This is Li!

Person("Dan").sleep(10).eat("dinner");
// 输出：
// Hi! This is Dan!
// 等待10秒..
// Wake up after 10
// Eat dinner~

Person("Jerry").eat("dinner").eat("supper");
// 输出：
// Hi This is Jerry!
// Eat dinner~
// Eat supper~

Person("Smith").sleepFirst(5).eat("supper");
// 输出：
// 等待5秒
// Wake up after 5
// Hi This is Smith!
// Eat supper
```

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/738)

## 请写出正确的执行结果

```js
var yideng = {
  bar: function () {
    return this.baz;
  },
  baz: 1,
};
(function () {
  console.log(typeof arguments[0]());
})(yideng.bar);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/737)

## 请写出正确的执行结果

```js
function test() {
  console.log("out");
}
(function () { 
  if (false) {
    function test() {
      console.log("in");
    }
    test();
  }
})();
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/736)

## 请写出正确的执行结果

```js
var x = [typeof x, typeof y][1];
typeof x;
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/735)

## 请写出正确的执行结果

```js
(function (x) {
  delete x;
  return x;
})(1);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/734)

## 请写出正确的执行结果

```js
var x = 1;
if (function f() {}) {
  x += typeof f;
}
x;
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/733)

## 请写出正确的执行结果

```js
function f() {
  return f;
}
new f() instanceof f;
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/732)

## 请写出代码正确执行结果，并解释原因

```js
Object.prototype.a = "a";
Function.prototype.a = "a1";
function Person() {}
var yideng = new Person();
console.log(yideng.a);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/731)

## 请写出正确的执行结果

```js
var yideng = [0];
if (yideng) {
  console.log(yideng == true);
} else {
  console.log("yideng");
}
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/730)

## 请写出正确的执行结果

```js
function yideng() {
  return
  {
    a: 1;
  }
}
var result = yideng();
console.log(result.a);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/729)

## 按要求完成代码

```js
const timeout = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
const ajax1 = () =>
  timeout(2000).then(() => {
    console.log("1");
    return 1;
  });
const ajax2 = () =>
  timeout(1000).then(() => {
    console.log("2");
    return 2;
  });
const ajax3 = () =>
  timeout(2000).then(() => {
    console.log("3");
    return 3;
  });
const mergePromise = (ajaxArray) => {
  // 1,2,3 done [1,2,3] 此处写代码 请写出ES6、ES3 2中解法
};
mergePromise([ajax1, ajax2, ajax3]).then((data) => {
  console.log("done");
  console.log(data); // data 为[1,2,3]
});
// 执行结果为：1 2 3 done [1,2,3]
```

公司：阿里

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/728)

## 请写出正确的执行结果

```html
<script>
  //使用未定义的变量yideng
  yideng;
  console.log(1);
</script>
<script>
  console.log(2);
</script>
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/727)

## 请写出正确的执行结果

```js
var yideng = Array(3);
yideng[0] = 2;
var result = yideng.map(function (elem) {
  return "1";
});
console.log(result);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/726)

## 请修改代码能跳出死循环

```js
while (1) {
  switch ("yideng") {
    case "yideng":
    //禁止直接写一句break
  }
}
```

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/725)

## 请写出代码正确执行结果

```js
[1 < 2 < 3, 3 < 2 < 1];
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/723)

## 请写出代码正确执行结果

```js
2 == [[[2]]];
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/722)

## 计算以上字节每位 ✈️ 的起码点，并描述这些字节的起码点代表什么

```js
console.log("✈️".length);
// 1.计算以上字节每位✈️的起码点
// 2.描述这些字节的起码点代表什么
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/721)

## 请写出代码正确执行结果，并解释原因

```js
var yidenga = Function.length,
  yidengb = new Function().length;
console.log(yidenga === yidengb);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/720)

## 请写出代码正确执行结果

```js
var length = 10;
function fn() {
  console.log(this.length);
}
var yideng = {
  length: 5,
  method: function (fn) {
    fn();
    arguments[0]();
  },
};
yideng.method(fn, 1);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/719)

## 介绍箭头函数的 this

公司：百分点

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/747)

## 请写出代码正确执行结果，并解释原因

```js
var yi = new Date("2018-08-20"),
  deng = new Date(2018, 08, 20);
[yi.getDay() === deng.getDay(), yi.getMonth() === deng.getMonth()];
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/718)

## 请写出代码正确执行结果

```js
for (
  let i = (setTimeout(() => console.log("a->", i)), 0);
  setTimeout(() => console.log("b->", i)), i < 2;
  i++
) {
  i++;
}
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/717)

## 请写出代码正确执行结果，并解释原因

```js
[typeof null, null instanceof Object];
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/716)

## 请问当前 textarea 文本框展示的内容是什么？

```html
<textarea maxlength="10" id="yideng"></textarea>
<script>
  document.getElementById("yideng").value = "a".repeat(10) + "b";
</script>
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/715)

## 请写出代码正确执行结果

```js
function sidEffecting(ary) {
  arr[0] = arr[2];
}
function yideng(a, b, c = 3) {
  c = 10;
  sidEffecting(arguments);
  return a + b + c;
}
yideng(1, 1, 1);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/714)

## 请写出代码正确执行结果

```js
yideng();
var flag = true;
if (flag) {
  function yideng() {
    console.log("yideng1");
  }
} else {
  function yideng() {
    console.log("yideng2");
  }
}
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/713)

## 请写出代码正确执行结果，并解释为什么

```js
var min = Math.min(),
  max = Math.max();
console.log(min < max);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/712)

## 请手写实现一个拖拽

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/711)

## 请手动实现一个浅拷贝

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/710)

## 介绍 instanceof 原理，并手动实现

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/709)

## 请实现一个 JSON.stringfy

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/708)

## 请实现一个 JSON.parse

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/707)

## 请写出代码的正确执行结果，并解释原因？

```js
console.log("hello" + (1 < 2) ? "word" : "me");
```

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/700)

## 请写出代码的正确执行结果，并解释原因？

```js
var a = (b = 1);
(function () {
  var a = (b = 2);
})();
console.log(a, b);
```

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/699)

## 请写出代码的正确执行结果，并解释原因？

```js
if ([] instanceof Object) {
  console.log(typeof null);
} else {
  console.log(typeof undefined);
}
```

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/698)

## 请写出代码的正确执行结果，并解释原因？

```js
var obj = {};
obj.name = "first";
var peo = obj;
peo.name = "second";
console.log(obj.name);
```

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/697)

## 请写出代码的正确执行结果，并解释原因？

```js
function say(word) {
  let word = "hello";
  console.log(word);
}
say("hello Lili");
```

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/696)

## 请写出代码正确执行结果，并解释原因？

```js
function fun(n, o) {
  console.log(o);
  return {
    fun: function (m) {
      return fun(m, n);
    },
  };
}
var b = fun(0).fun(1).fun(2).fun(3);
```

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/695)

## JavaScript 中如何模拟实现方法的重载

公司：会小二

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/689)

## 请解释 JSONP 的工作原理

公司：会小二、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/688)

## 用 html、css、js 模拟实现一个下拉框，使得下拉框在各个浏览器下的样式和行为完全一致，说出你的设计方案，并且重点说明功能设计时要考虑的因素

公司：会小二

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/687)

## 实现一个打点计时器

```js
/* 
  1.从start至end,每隔100毫秒console.log一个数字，每次数字增幅为1
  2.返回的对象中需要包含一个cancel方法，用于停止定时操作
  3.第一个数字需要立即输出
*/
```

公司：会小二

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/685)

## JavaScript 写一个单例模式，可以具体到某一个场景

公司：会小二

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/683)

## JavaScript 基本数据类型都有哪些？用 typeOf 判断分别显示什么？

公司：会小二、安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/682)

## 怎么判断引用类型数据，兼容判断原始类型数据呢？

公司：会小二

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/681)

## 概述异步编程模型

公司：酷狗

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/674)

## 在一个 ul 里有 10 个 li,实现点击对应的 li,输出对应的下标

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/673)

## 分别对以下数组进行去重，1:[1,'1',2,'2',3]，2:[1,[1,2,3['1','2','3'],4],5,6]

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/672)

## 简述 JavaScript 中的函数的几种调用方式

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/671)

## 编写一个 Person 类，并创建两个不同的 Person 对象

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/670)

## 手写实现 call

公司：腾讯应用宝

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/666)

## 手写实现 apply

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/665)

## 一个 dom 必须要操作几百次，该如何解决，如何优化？

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/664)

## 页面埋点怎么实现

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/660)

## 除了 jsonp、postmessage 后端控制，怎么实现跨页面通讯

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/659)

## 说一下 let、const 的实现，动手实现一下

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/655)

## addEventListener 再 removeListener 会不会造成内存泄漏

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/651)

## scrollview 如何进行性能优化(例如 page=100 时，往上滚动)

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/650)

## 原生 JavaScript 获取 ul 中的第二个 li 里边的 p 标签的内容

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/648)

## 说下 offsetWith 和 clientWidth、offsetHeight 和 clientHeight 的区别，说说 offsetTop，offsetLeft，scrollWidth、scrollHeight 属性都是干啥的

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/647)

## 写一个函数打乱一个数组，传入一个数组，返回一个打乱的新数组

公司：快手

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/643)

## 数组截取插入 splice，push 返回值，数组的栈方法、队列方法、排序方法、操作方法、迭代方法说一下

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/642)

## 判断一个变量的类型，写个方法用 Object.prototype.toString 判断传入数据的类型

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/641)

## 判断一个变量的类型，写个方法用 Object.prototype.toString 判断传入数据的类型？Object.prototype.toString.call(Symbol) 返回什么？

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/640)

## 对作用域和闭包的理解，解释下 let 和 const 的块级作用域

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/639)

## 以下代码输出什么？

```js
setTimeout(function () {
  console.log(1);
}, 0);
new Promise(function executor(resolve) {
  console.log(2);
  for (var i = 0; i < 10000; i++) {
    i == 9999 && resolve();
  }
  console.log(3);
}).then(function () {
  console.log(4);
});
console.log(5);
```

公司：心娱

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/638)

## switch case，case 具体是怎么比较的，哪些情况下会走到 default

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/637)

## 说下 typeof()各种类型的返回值？instanceof 呢？

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/636)

## if([] == 0), [1,2] == "1,2", if([]), [] == 0 具体是怎么对比的

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/635)

## 如何加快页面渲染速度，都有哪些方式

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/634)

## generator 的实现原理

公司：滴滴、58

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/633)

## 判断是否是数组的方法

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/627)

## 手写 EventEmitter 实现

公司：头条、亚美科技

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/624)

## 给出的两行代码为什么这么输出

```js
var s = "laohu";
s[0] = 1;
console.log(s); //laohu
var s = "laohu";
s += 2020;
console.log(s); // laohu2020
// 上面两行为什么这么输出
```

公司：老虎

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/622)

## 动画性能如何检测

公司：酷狗

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/621)

## 平时都用到了哪些设计模式

公司：酷狗、沪江、58

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/619)

## 对 service worker 的理解

公司：酷狗

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/617)

## 单点登录实现原理

公司：CVTE

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/862)

## 尾递归实现

公司：CVTE

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/861)

## 有 1000 个 dom，需要更新其中的 100 个，如何操作才能减少 dom 的操作？

公司：爱范儿

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/860)

## 商城的列表页跳转到商品的详情页，详情页数据接口很慢，前端可以怎么优化用户体验？

公司：爱范儿

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/859)

## 多个 tab 只对应一个内容框，点击每个 tab 都会请求接口并渲染到内容框，怎么确保频繁点击 tab 但能够确保数据正常显示？

公司：爱范儿

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/858)

## 请实现鼠标点击页面中的任意标签，alert 该标签的名称(注意兼容性)

公司：爱范儿、道一云

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/854)

## 完成一个表达式，验证用户输入是否是电子邮箱

公司：爱范儿

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/853)

## 原生实现 ES5 的 Object.create()方法

公司：爱范儿

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/852)

## 如何记录前端在用户浏览器上发生的错误并汇报给服务器？

公司：爱范儿

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/850)

## 有哪几种方式可以解决跨域问题？(描述对应的原理)

公司：爱范儿

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/849)

## 按要求完成题目

```js
/* 
  a)在不使用vue、react的前提下写代码解决一下问题
    一个List页面上，含有1000个条目的待办列表，现其中100项在同一时间达到了过期时间，需要在对应项的text-node里添加“已过期”文字。需要尽可能减少dom重绘次数以提升性能。
  b)尝试使用vue或react解决上述问题
*/
```

公司：爱范儿

分类：JavaScript、Vue、React、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/848)

## 你是如何组织 JavaScript 代码的？（可以从模块、组件、模式、编程思想等方面回答）

公司：爱范儿

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/847)

## 填充代码实现 template 方法

```js
var str = "您好，<%=name%>。欢迎来到<%=location%>";
function template(str) {
  // your code
}
var compiled = template(srt);
// compiled的输出值为：“您好，张三。欢迎来到网易游戏”
compiled({ name: "张三", location: "网易游戏" });
```

公司：网易

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/844)

## 请描述下为什么页面需要做优化？并写出常用的页面优化实现方案？

公司：玄武科技

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/841)

## 请列出至少 5 个 JavaScript 常用的内置对象，说明用途

公司：玄武科技

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/838)

## 请描述下 JavaScript 中 Scope、Closure、Prototype 概念，并说明 JavaScript 封装、继承实现原理

公司：玄武科技

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/837)

## 请列出目前主流的 JavaScript 模块化实现的技术有哪些？说出它们的区别？

公司：玄武科技

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/836)

## 请用 JavaScript 代码实现事件代理

公司：玄武科技

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/832)

## 实现格式化输出，比如输入 999999999，输出 999,999,999

公司：亚美科技

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/831)

## 使用 JavaScript 实现 cookie 的设置、读取、删除

公司：亚美科技

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/830)

## 请编写一个 JavaScript 函数 parseQueryString,它的用途是把 URL 参数解析为一个对象，url="http://iauto360.cn/index.php?key0=0&key1=1&key2=2"

公司：亚美科技

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/829)

## 如何实现 a,b 两个变量的交换

公司：高思教育

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/825)

## 给 JavaScript 的 String 原生对象添加一个名为 trim 的原型方法，用于截取字符串前后的空白字符

公司：高思教育

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/822)

## 微任务和宏任务的区别

公司：58

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/814)

## 原生 JavaScript 实现图片懒加载的思路

公司：安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/809)

## 回调函数和任务队列的区别

公司：安居客

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/808)

## 写出下面代码的输出结果

```js
//counter.js
let counter = 10;
export default counter;

//index.js
import myCounter from "./counter";
myCounter += 1;
console.log(myCounter);
```

公司：快手

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/802)

## 有这样一个函数 A,要求在不改变原有函数 A 功能以及调用方式的情况下，使得每次调用该函数都能在控制台打印出“HelloWorld”

```js
function A() {
  console.log("调用了函数A");
}
```

公司：新东方

分类：JavaScript、编程题

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/800)

## 在浏览器执行以下代码，写出打印结果

```js
console.log("start");
setTimeout(() => {
  console.log("children2");
  Promise.resolve().then(() => {
    console.log("children3");
  });
}, 0);
new Promise(function (resolve, reject) {
  console.log("children4");
  setTimeout(function () {
    console.log("children5");
    resolve("children6");
  }, 0);
}).then((res) => {
  console.log("children7");
  setTimeout(() => {
    console.log(res);
  }, 0);
});
```

公司：新东方

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/799)

## 请写出弹出值，并解释为什么？

```js
alert(a);
a();
var a = 3;
function a() {
  alert(10);
}
alert(a);
a = 6;
a();
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/794)

## 写出输出值，并解释为什么

```js
function test(m) {
  m = { v: 5 };
}
var m = { k: 30 };
test(m);
alert(m.v);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/793)

## 请写出代码执⾏结果，并解释为什么

```js
function yideng() {
  console.log(1);
}
(function () {
  if (false) {
    function yideng() {
      console.log(2);
    }
  }
  console.log(typeof yideng);
  yideng();
})();
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/792)

## 请写出代码执⾏结果，并解释为什么

```js
function fn() {
  console.log(this.length);
}
var person = {
  length: 5,
  method: function (fn) {
    fn();
  },
};
person.method(fn, 1);
```

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/790)

<!-- ## 给定⼀个⼤⼩为 n 的数组，找到其中的众数。众数是指在数组中出现次数⼤于 n/2 的元素

分类：数据结构与算反

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/789) -->

## 原生实现addClass,用多种方法

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/783)

## 实现一个倒计时,setInterval实现的话，如何消除时间误差

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/871)

## 函数中的arguments是数组吗？若不是，如何将它转化为真正的数组？

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/866)

## 请写出以下代码的打印结果

```js
if([] == false){console.log(1)};
if({} == false) {console.log(2)};
if([]){console.log(3)};
if([1] == [1]){console.log(4)};
```

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/865)

## 以最小的改动解决以下代码的错误(可以使用ES6)

```js
const obj = {
  name:"jsCoder",
  skill:["es6","react","angular"],
  say:function(){
    for(var i = 0,len = this.skill.length;i<len;i++){
      setTimeout(function(){
        console.log('No.' + i + this.name);
        console.log(this.skill[i]);
        console.log('----------------');
      },0);
      console.log(i);
    }
  }
}
obj.say();

/* 
  期望得到下面的结果
  1
  2
  3
  No.1 jsCoder
  es6
  ----------------
  No.2 jsCoder
  react
  ----------------
  No.3 jsCoder
  angular
*/
```

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/864)

## 实现Function 原型的bind方法，使得以下程序最后能输出“success”

```js
function Animal(name,color){
  this.name = name;
  this.color = color;
}
Animal.prototype.say = function(){
  return `I'm a ${this.color}${this.name}`;
}
const Cat = Animal.bind(null,'cat');
const cat = new Cat('white');
if(cat.say() === "I'm white cat" && cat instanceof Cat && cat instanceof Animal){
  console.log('sunccess');
}
```

公司：头条

分类：JavaScript

[答案&解析](https://github.com/lgwebdream/FE-Interview/issues/863)

```js
Animal.prototype.bind = function (context,...arg) {
    const _this = this
    return function F(...arg2) { 
        // 判断是否用于构造函数
        if (this instanceof F) {
          return new _this(...args1, ...args2)
        }
       return _this.apply(context, arg.concat(arg2))
    }
}
```

## 文件上传如何做断点续传

公司：网易、洋葱学院

分类：JavaScript

答案：

主要思路如下

客户端将大文件分片，给每个分片连续编号
并发向服务器提交每个分片，客户端记录下成功上传的分片id，将连续的最大的id号作为断点续传和进度计算的标示，
如总共10个分片，其中(1,2,3,4,7,8,10)这几个分片上传成功，客户端记录的就是4。进度就是40%
若未上传成功之前关闭浏览器导致上传中断，那么下一次从客户端本地存储取出上一次的进度4，从第五个分片开始上传。
注意点：1. 断点上传前浏览器需要判断文件是否修改过，可以利用文件的lastModified属性简单判断一下。
2. 这个机制非常类似于tcp的分片和重组。tcp有超时重传的机制，我们这里也可以加入异常重传机制。

## 列举 3 种强制类型转换和 2 种隐式类型转换

公司：58

分类：JavaScript

答案：

```js
// 强制类型转换
var a = parseInt("123")
console.log(typeof a) // number
var b = parseFloat("123")
console.log(typeof b) // number
var c = 123
console.log(typeof c.toString())// string
var d = Number("1234")
console.log(typeof d)
var e = Boolean('true')
console.log(typeof e)

// 隐式转换
console.log(typeof (1 + '1')) // string
console.log(typeof (true + '1')) // string
console.log(typeof (1 + true)) // number
```
