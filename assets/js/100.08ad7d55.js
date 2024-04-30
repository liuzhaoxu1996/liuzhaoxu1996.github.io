(window.webpackJsonp=window.webpackJsonp||[]).push([[100],{458:function(t,e,s){"use strict";s.r(e);var r=s(25),a=Object(r.a)({},(function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",{attrs:{id:"资源共享"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#资源共享"}},[t._v("#")]),t._v(" 资源共享")]),t._v(" "),s("p",[t._v("Webpack 5 Module Federation 模块联合允许 JavaScript 应用程序在客户端和服务器上动态运行来自另一个包/构建的代码, 简单来说就是允许运行时动态决定代码的引入和加载。")]),t._v(" "),s("ul",[s("li",[s("p",[s("strong",[t._v("功能")]),t._v("：之前 webpack 对外只提供了一个全局的 webpackJsonp 数组(注意不是方法)，每个异步 chunk 加载后通过该数组将自身的 modules push 到内部 webpack_modules 对象上，内部变量可以访问到该对象，但外部是无法获取到的，完全属于“暗箱操作”，这也导致了无法跟外界环境进行模块“共享”，webpack5 中引进了模块联合机制, 可以让构建后的代码动态运行的跑在另一份代码中。")])]),t._v(" "),s("li",[s("p",[s("strong",[t._v("目的")]),t._v("：通过细化功能模块、组件复用、共享第三方库、runtime dependencies 线上加载 npm 包等，可以更好的服务于多页应用、微前端等开发模式。")])]),t._v(" "),s("li",[s("p",[s("strong",[t._v("业务场景")]),t._v(":")]),t._v(" "),s("ul",[s("li",[t._v("多个业务依赖同一个通用组件")])])])]),t._v(" "),s("h2",{attrs:{id:"mf-vs-npm-包管理模式"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#mf-vs-npm-包管理模式"}},[t._v("#")]),t._v(" MF VS npm 包管理模式")]),t._v(" "),s("ul",[s("li",[s("p",[s("strong",[t._v("问题一: 历史代码:")]),t._v(" 业务不依赖 npm, 没办法引入 npm 包")])]),t._v(" "),s("li",[s("p",[s("strong",[t._v("问题二: 发布效率:")]),t._v(" 如果 npm 包升级, 还是需要同时升级 n 多个业务")])])]),t._v(" "),s("h2",{attrs:{id:"mf-vs-sdk-模式"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#mf-vs-sdk-模式"}},[t._v("#")]),t._v(" MF VS sdk 模式")]),t._v(" "),s("p",[t._v("参考 jquery 的引入方式，我们用另外一个项目去实现这些功能，然后把代码打包成 ES5 代码，对外提供很多接口，然后在各个品类页，引入我们提供的加载脚本，内部会自动去加载文件，获取每个模块的 js 文件的 CDN 地址并且加载。这样做到各个模块各自独立，并且所有模块和各个品类形成独立。")]),t._v(" "),s("ul",[s("li",[s("p",[s("strong",[t._v("问题一: 依赖冲突:")]),t._v(" 比如 sdk 依赖"),s("code",[t._v("babel-ployfill")]),t._v("与网页依赖的版本不一致, 会脚本导致加载失败")])]),t._v(" "),s("li",[s("p",[s("strong",[t._v("问题二: 依赖冗余:")]),t._v(" 比如一个页面引入 4 个 sdk, 每个 sdk 都依赖了 "),s("code",[t._v("jquery")]),t._v(", 那么其实要引入 4 遍 "),s("code",[t._v("jquery")])])])]),t._v(" "),s("h2",{attrs:{id:"参考"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#参考"}},[t._v("#")]),t._v(" 参考")]),t._v(" "),s("p",[s("a",{attrs:{href:"http://www.alloyteam.com/2020/04/14338/#prettyPhoto",target:"_blank",rel:"noopener noreferrer"}},[t._v("AlloyTeam 在腾讯文档上的实践"),s("OutboundLink")],1)])])}),[],!1,null,null,null);e.default=a.exports}}]);