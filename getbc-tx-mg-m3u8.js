const https = require("https");
const http  = require("http");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

/* ✅✅✅ 全局跨域 */
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

/* ✅ 原始 302 递归解析逻辑（完全保留你原版） */
function resolveRedirect(url, depth = 0) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith("https") ? https : http;

        console.log(`➡️ 第 ${depth + 1} 次请求：`, url);

        const req = lib.get(url, { rejectUnauthorized: false }, res => {

            if (
                (res.statusCode === 301 || res.statusCode === 302) &&
                res.headers.location
            ) {
                const nextUrl = res.headers.location;
                res.destroy();
                return resolve(resolveRedirect(nextUrl, depth + 1));
            }

            console.log("✅ 最终真实 m3u8：", url);
            res.destroy();
            resolve(url);
        });

        req.on("error", err => reject(err));
    });
}

/* ✅ API 接口 */
app.get("/api/resolve", async (req, res) => {
    const proxyUrl = req.query.url;

    if (!proxyUrl) {
        return res.json({
            success: false,
            msg: "缺少 url 参数"
        });
    }

    try {
        const realUrl = await resolveRedirect(proxyUrl);

        let proxiedUrl = realUrl;

        // ✅ 预留：后期你要自动转自己 Nginx 反代
        // proxiedUrl = proxiedUrl.replace(/^https?:\/\/hlszymgsplive\.miguvideo\.com:8080\//i,
        //     "https://migu.alltv.cc/mgmg/"
        // );

        res.json({
            success: true,
            proxy: proxyUrl,
            real: proxiedUrl
        });

    } catch (err) {
        res.json({
            success: false,
            proxy: proxyUrl,
            error: err.message
        });
    }
});

/* ✅ 启动 */
app.listen(PORT, () => {
    console.log(`✅ 服务已启动`);
    console.log(`✅ http://localhost:${PORT}/api/resolve?url=xxxx`);
});
