# Static site served by unprivileged nginx on :8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css favicon.svg /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
# Cloudflare caches JS/CSS for 4 hours, so index.html loads them from /v/<content hash>/.
# A deploy that changes them changes the URL. nginx maps /v/<hash>/x back to /x.
USER root
RUN cd /usr/share/nginx/html && v=$(cat style.css js/*.js | md5sum | cut -c1-10) && sed -i "s/__V__/$v/g" index.html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
