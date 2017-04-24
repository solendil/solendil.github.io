!function(e){function r(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}var t={};r.m=e,r.c=t,r.i=function(e){return e},r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n})},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},r.p="",r(r.s=11)}([function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function i(e,r){if(!(e instanceof r))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(r,"__esModule",{value:!0});var o=function(){function e(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(r,t,n){return t&&e(r.prototype,t),n&&e(r,n),r}}(),a=t(10),u=n(a),f=t(2),s=n(f),l=u.default.get("worker").level(u.default.WARN),d=function(e,r,t){var n,i,o,a,u,f=t.buffer,s=0;for(i=t.y1;i<=t.y2;i++)for(o=(t.x1+.5)*e.a+(i+.5)*e.c+e.e,a=(t.x1+.5)*e.b+(i+.5)*e.d+e.f,n=t.x1;n<=t.x2;n++)u=r(o,a,e.iter),u===e.iter?f[s++]=0:f[s++]=u,o+=e.a,a+=e.b},c=function(e,r,t,n){var i,o,a,u,f,s=t.buffer,l=0;for(o=t.y1;o<=t.y2;o+=n)for(l=(o-t.y1)*t.width,i=t.x1;i<=t.x2;i+=n)a=(i+n/2)*e.a+(o+n/2)*e.c+e.e,u=(i+n/2)*e.b+(o+n/2)*e.d+e.f,f=r(a,u,e.iter),f===e.iter?s[l]=0:s[l]=f,l+=n;for(l=0,o=0;o<t.height;o++)for(i=0;i<t.width;i++)o%n==0&&i%n==0||(s[l]=s[(o-o%n)*t.width+i-i%n]),l++},b=function(e,r,t,n){var i,o,a,u,f,s,l,d,c,b=t.buffer,h=Math.sqrt(e.a*e.a+e.b*e.b),p=n*n,v=h/n,m=0;for(o=t.y1;o<=t.y2;o++)for(i=t.x1;i<=t.x2;i++)if(0!==b[m]||o===t.y1||o===t.y2-1||i===t.x1||i===t.y1-1||0!==b[m+1]||0!==b[m-1]||0!==b[m+t.width]||0!==b[m-t.width]){for(a=i*e.a+o*e.c+e.e+v/2,u=i*e.b+o*e.d+e.f-v/2,f=0,c=0;c<p;c++)s=a+Math.trunc(c/n)*v,l=u-c%n*v,f+=r(s,l,e.iter);d=f/p,b[m++]=d===e.iter?0:d}else m++},h=function(){function e(r){i(this,e),this.postMessage=r,this.workerId="worker-?",l.debug("definition")}return o(e,[{key:"onmessage",value:function(e){var r=e.data;switch(l.debug("received",r.action,r),r.action){case"init":this.workerId="worker-"+r.id,l=u.default.get("worker-"+r.id).level(l.currentLevel),l.debug("changed ID");break;case"draw":var t=s.default.getFunction(r.model.type,r.model.smooth);if("normal"===r.params.details)d(r.model,t,r.tile);else if("subsampling"===r.params.details)c(r.model,t,r.tile,r.params.size);else{if("supersampling"!==r.params.details)throw new Error("Unknown detail");b(r.model,t,r.tile,r.params.size)}var n={action:"end-draw",tile:r.tile,workerId:this.workerId,batchId:r.batchId};this.postMessage(n,[n.tile.buffer.buffer]);break;default:throw new Error("Illegal action",r)}}}]),e}();r.default=h},function(e,r,t){function n(e){return t(i(e))}function i(e){var r=o[e];if(!(r+1))throw new Error("Cannot find module '"+e+"'.");return r}var o={"./burningbird.js":3,"./burningship.js":4,"./example.js":5,"./mandelbrot.js":6,"./mandelbrot3.js":7,"./mandelbrot4.js":8,"./tippetts.js":9};n.keys=function(){return Object.keys(o)},n.resolve=i,e.exports=n,n.id=1},function(e,r,t){"use strict";function n(e,r){if(!(e instanceof r))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(r,"__esModule",{value:!0});var i=function(){function e(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(r,t,n){return t&&e(r.prototype,t),n&&e(r,n),r}}(),o=t(1),a=function(){function e(){var r=this;n(this,e),this.byKey={},o.keys().forEach(function(e){var t=o(e).default;r.byKey[t.id]=t})}return i(e,[{key:"getFunction",value:function(e,r){var t=this.byKey[e];return r?t.fn.smooth||t.fn.normal:t.fn.normal}},{key:"getPreset",value:function(e){var r=this.byKey[e];return Object.assign({type:e},r.preset)}},{key:"listForUi",value:function(){return Object.values(this.byKey).filter(function(e){return!e.hidden}).sort(function(e,r){return e.uiOrder-r.uiOrder})}}]),e}();r.default=new a},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=1/Math.log(2);r.default={id:"burningbird",uiOrder:2.5,name:"Burning Bird",preset:{x:-.46,y:.07,w:3.26,iter:50},fn:{normal:function(e,r,t){var n,i,o=0,a=0,u=0,f=0,s=0;for(r=-r;(i=(o+o)*a+r,n=u-f+e,o=n,a=Math.abs(i),!(++s>=t))&&(u=o*o,f=a*a,!(u+f>4)););return s},smooth:function(e,r,t){var i,o,a,u=0,f=0,s=0,l=0,d=0;for(r=-r;(a=(u+u)*f+r,o=s-l+e,u=o,f=Math.abs(a),!(++d>=t))&&(s=u*u,l=f*f,!(s+l>4)););if(d===t)return d;for(i=0;i<4;++i)a=(u+u)*f+r,o=s-l+e,u=o,f=Math.abs(a),s=u*u,l=f*f;return 5+d-Math.log(Math.log(s+l))*n}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=1/Math.log(2);r.default={id:"burningship",uiOrder:2,numericalId:2,name:"Burning Ship",preset:{x:-.4,y:.55,w:3,iter:50},fn:{normal:function(e,r,t){var n,i,o=0,a=0,u=0,f=0,s=0;for(r=-r;(i=(o+o)*a+r,n=u-f+e,o=Math.abs(n),a=Math.abs(i),!(++s>=t))&&(u=o*o,f=a*a,!(u+f>4)););return s},smooth:function(e,r,t){var i,o,a,u=0,f=0,s=0,l=0,d=0;for(r=-r;(a=(u+u)*f+r,o=s-l+e,u=Math.abs(o),f=Math.abs(a),!(++d>=t))&&(s=u*u,l=f*f,!(s+l>4)););if(d===t)return d;for(i=0;i<4;++i)a=(u+u)*f+r,o=s-l+e,u=Math.abs(o),f=Math.abs(a),s=u*u,l=f*f;return 5+d-Math.log(Math.log(s+l))*n}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.default={id:"example",numericalId:-1,hidden:!0,uiOrder:-1,name:"<b>ex</b>",preset:{x:-.7,y:0,w:2.5,iter:50},fn:{normal:function(e,r,t){return 0},smooth:function(e,r,t){return 0}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=1/Math.log(2);r.default={id:"mandelbrot",uiOrder:0,numericalId:0,name:"Mandelbrot",preset:{x:-.7,y:0,w:2.5,iter:50},fn:{normal:function(e,r,t){for(var n=0,i=0,o=0,a=0,u=0;u<t&&o+a<=4;++u)i=(n+n)*i+r,n=o-a+e,o=n*n,a=i*i;return u},smooth:function(e,r,t){for(var i=0,o=0,a=0,u=0,f=0,s=0;f<t&&a+u<=4;++f)o=(i+i)*o+r,i=a-u+e,a=i*i,u=o*o;if(f===t)return f;for(s=0;s<4;++s)o=(i+i)*o+r,i=a-u+e,a=i*i,u=o*o;return 5+f-Math.log(Math.log(a+u))*n}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=1/Math.log(4);r.default={id:"mandelbrot3",uiOrder:3,numericalId:1,name:"Multibrot <sup>3</sup>",preset:{x:0,y:0,w:3,iter:50},fn:{normal:function(e,r,t){for(var n,i,o=0,a=0,u=0,f=0,s=0;(n=u*o-3*o*f+e,i=3*u*a-f*a+r,o=n,a=i,!(++s>=t))&&(u=o*o,f=a*a,!(u+f>4)););return s},smooth:function(e,r,t){for(var i,o,a,u=0,f=0,s=0,l=0,d=0;(o=s*u-3*u*l+e,a=3*s*f-l*f+r,u=o,f=a,!(++d>=t))&&(s=u*u,l=f*f,!(s+l>4)););if(d===t)return d;for(i=0;i<4;++i)o=s*u-3*u*l+e,a=3*s*f-l*f+r,u=o,f=a,s=u*u,l=f*f;return 5+d-Math.log(Math.log(s+l))*n}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=1/Math.log(4);r.default={id:"mandelbrot4",uiOrder:4,numericalId:1,name:"Multibrot <sup>4</sup>",preset:{x:0,y:0,w:3,iter:50},fn:{normal:function(e,r,t){for(var n,i,o=0,a=0,u=0,f=0,s=0;(n=u*u-6*u*f+f*f+e,i=4*u*o*a-4*o*f*a+r,o=n,a=i,!(++s>=t))&&(u=o*o,f=a*a,!(u+f>4)););return s},smooth:function(e,r,t){for(var i,o,a=0,u=0,f=0,s=0,l=0;(i=f*f-6*f*s+s*s+e,o=4*f*a*u-4*a*s*u+r,a=i,u=o,!(++l>=t))&&(f=a*a,s=u*u,!(f+s>4)););return l===t?l:5+l-Math.log(Math.log(f+s))*n}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.default={id:"tippetts",uiOrder:1,numericalId:3,name:"Tippetts",preset:{x:-.2,y:0,w:4,iter:50},fn:{normal:function(e,r,t){for(var n=0,i=0,o=0,a=0,u=0;u<t&&o+a<=4;++u)n=o-a+e,i=(n+n)*i+r,o=n*n,a=i*i;return u}}}},function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n=function(){var e={ALL:100,DEBUG:100,INFO:200,WARN:300,ERROR:400,OFF:500},r={},t=console,i=function(){},o=function(r){return this.error=r<=e.ERROR?t.error.bind(t,"["+this.id+"] - ERROR - %s"):i,this.warn=r<=e.WARN?t.warn.bind(t,"["+this.id+"] - WARN - %s"):i,this.info=r<=e.INFO?t.info.bind(t,"["+this.id+"] - INFO - %s"):i,this.debug=r<=e.DEBUG?t.log.bind(t,"["+this.id+"] - DEBUG - %s"):i,this.log=t.log.bind(t,"["+this.id+"] %s"),this.currentLevel=r,this};return e.get=function(e){var t=r[e];if(!t){var i={id:e,level:o};i.level(n.ALL),t=i.log;for(var a in i)t[a]=i[a];r[e]=t}return t},e}();r.default=n},function(e,r,t){"use strict";function n(){postMessage.apply(void 0,arguments)}var i=t(0),o=function(e){return e&&e.__esModule?e:{default:e}}(i),a=new o.default(n);onmessage=function(){a.onmessage.apply(a,arguments)}}]);