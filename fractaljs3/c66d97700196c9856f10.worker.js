!function(e){function t(n){if(r[n])return r[n].exports;var o=r[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,t),o.l=!0,o.exports}var r={};return t.m=e,t.c=r,t.i=function(e){return e},t.d=function(e,r,n){t.o(e,r)||Object.defineProperty(e,r,{configurable:!1,enumerable:!0,get:n})},t.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(r,"a",r),r},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=5)}([function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var a=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),i=r(4),u=n(i),f=r(3),l=n(f),s=u.default.get("worker").level(u.default.WARN),d=function(e,t,r){var n,o,a,i,u,f=r.buffer,l=0;for(o=r.y1;o<=r.y2;o++)for(a=(r.x1+.5)*e.a+(o+.5)*e.c+e.e,i=(r.x1+.5)*e.b+(o+.5)*e.d+e.f,n=r.x1;n<=r.x2;n++)u=t(a,i,e.iter),u===e.iter?f[l++]=0:f[l++]=u,a+=e.a,i+=e.b},c=function(e,t,r,n){var o,a,i,u,f,l=r.buffer,s=0;for(a=r.y1;a<=r.y2;a+=n)for(s=(a-r.y1)*r.width,o=r.x1;o<=r.x2;o+=n)i=(o+n/2)*e.a+(a+n/2)*e.c+e.e,u=(o+n/2)*e.b+(a+n/2)*e.d+e.f,f=t(i,u,e.iter),f===e.iter?l[s]=0:l[s]=f,s+=n;for(s=0,a=0;a<r.height;a++)for(o=0;o<r.width;o++)a%n===0&&o%n===0||(l[s]=l[(a-a%n)*r.width+o-o%n]),s++},b=function(e,t,r,n){var o,a,i,u,f,l,s,d,c,b=r.buffer,h=Math.sqrt(e.a*e.a+e.b*e.b),v=n*n,p=h/n,g=0;for(a=r.y1;a<=r.y2;a++)for(o=r.x1;o<=r.x2;o++){for(i=(o+.5)*e.a+(a+.5)*e.c+e.e-p/2,u=(o+.5)*e.b+(a+.5)*e.d+e.f-p/2,f=0,c=0;c<v;c++)l=i+Math.trunc(c/n)*p,s=u+c%n*p,f+=t(l,s,e.iter);d=f/v,b[g++]=d===e.iter?0:d}},h=function(){function e(t){o(this,e),this.postMessage=t,this.workerId="worker-?",s.debug("definition")}return a(e,[{key:"onmessage",value:function(e){var t=e.data;switch(s.debug("received",t.action,t),t.action){case"init":this.workerId="worker-"+t.id,s=u.default.get("worker-"+t.id).level(s.currentLevel),s.debug("changed ID");break;case"draw":var r=(0,l.default)(t.model);"normal"===t.params.details?d(t.model,r,t.tile):"subsampling"===t.params.details?c(t.model,r,t.tile,t.params.size):"supersampling"===t.params.details&&b(t.model,r,t.tile,t.params.size);var n={action:"end-draw",tile:t.tile,workerId:this.workerId,batchId:t.batchId};this.postMessage(n,[n.tile.buffer.buffer]);break;default:throw new Error("Illegal action",t)}}}]),e}();t.default=h},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=4;t.default={mandelbrot:function(e,t,r){for(var o=0,a=0,i=0,u=0,f=0;f<r&&i+u<=n;++f)a=(o+o)*a+t,o=i-u+e,i=o*o,u=a*a;return f},burningship:function(e,t,r){var o,a,i=0,u=0,f=0,l=0,s=0;for(t=-t;(a=(i+i)*u+t,o=f-l+e,i=Math.abs(o),u=Math.abs(a),!(++s>=r))&&(f=i*i,l=u*u,!(f+l>n)););return s},mandelbrot3:function(e,t,r){for(var o,a,i=0,u=0,f=0,l=0,s=0;(o=f*i-3*i*l+e,a=3*f*u-l*u+t,i=o,u=a,!(++s>=r))&&(f=i*i,l=u*u,!(f+l>n)););return s},mandelbrot4:function(e,t,r){for(var o,a,i=0,u=0,f=0,l=0,s=0;(o=f*f-6*f*l+l*l+e,a=4*f*i*u-4*i*l*u+t,i=o,u=a,!(++s>=r))&&(f=i*i,l=u*u,!(f+l>n)););return s},tippetts:function(e,t,r){for(var o=0,a=0,i=0,u=0,f=0;f<r&&i+u<=n;++f)o=i-u+e,a=(o+o)*a+t,i=o*o,u=a*a;return f}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=4,o=1/Math.log(2),a=1/Math.log(4);t.default={mandelbrot:function(e,t,r){for(var a=0,i=0,u=0,f=0,l=0,s=0;l<r&&u+f<=n;++l)i=(a+a)*i+t,a=u-f+e,u=a*a,f=i*i;if(l===r)return l;for(s=0;s<4;++s)i=(a+a)*i+t,a=u-f+e,u=a*a,f=i*i;return 5+l-Math.log(Math.log(u+f))*o},mandelbrot3:function(e,t,r){for(var o,i,u,f=0,l=0,s=0,d=0,c=0;(i=s*f-3*f*d+e,u=3*s*l-d*l+t,f=i,l=u,!(++c>=r))&&(s=f*f,d=l*l,!(s+d>n)););if(c===r)return c;for(o=0;o<4;++o)i=s*f-3*f*d+e,u=3*s*l-d*l+t,f=i,l=u,s=f*f,d=l*l;return 5+c-Math.log(Math.log(s+d))*a},mandelbrot4:function(e,t,r){for(var o,i,u=0,f=0,l=0,s=0,d=0;(o=l*l-6*l*s+s*s+e,i=4*l*u*f-4*u*s*f+t,u=o,f=i,!(++d>=r))&&(l=u*u,s=f*f,!(l+s>n)););return d===r?d:5+d-Math.log(Math.log(l+s))*a},burningship:function(e,t,r){var a,i,u,f=0,l=0,s=0,d=0,c=0;for(t=-t;(u=(f+f)*l+t,i=s-d+e,f=Math.abs(i),l=Math.abs(u),!(++c>=r))&&(s=f*f,d=l*l,!(s+d>n)););if(c===r)return c;for(a=0;a<4;++a)u=(f+f)*l+t,i=s-d+e,f=Math.abs(i),l=Math.abs(u),s=f*f,d=l*l;return 5+c-Math.log(Math.log(s+d))*o}}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e){return e.smooth&&e.type in f.default?f.default[e.type]:i.default[e.type]}Object.defineProperty(t,"__esModule",{value:!0}),t.default=o;var a=r(1),i=n(a),u=r(2),f=n(u)},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){var e={ALL:100,DEBUG:100,INFO:200,WARN:300,ERROR:400,OFF:500},t={},r=console,o=function(){},a=function(t){return this.error=t<=e.ERROR?r.error.bind(r,"["+this.id+"] - ERROR - %s"):o,this.warn=t<=e.WARN?r.warn.bind(r,"["+this.id+"] - WARN - %s"):o,this.info=t<=e.INFO?r.info.bind(r,"["+this.id+"] - INFO - %s"):o,this.debug=t<=e.DEBUG?r.log.bind(r,"["+this.id+"] - DEBUG - %s"):o,this.log=r.log.bind(r,"["+this.id+"] %s"),this.currentLevel=t,this};return e.get=function(e){var r=t[e];if(!r){var o={id:e,level:a};o.level(n.ALL),r=o.log;for(var i in o)r[i]=o[i];t[e]=r}return r},e}();t.default=n},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(){postMessage.apply(void 0,arguments)}var a=r(0),i=n(a),u=new i.default(o);onmessage=function(){u.onmessage.apply(u,arguments)}}]);