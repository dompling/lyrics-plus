const Translates = {
    baidu: async (lyrics, token) => {
        const [appid, securityKey] = token.split(":");
        const salt = Date.now();
        const query = lyrics.map(item => item.text).join("\n");
        const queryObj = {
            q: query,
            from: "auto",
            to: Spicetify.Locale.getLocale().split("-")[0],
            appid,
            salt,
            sign: md5(appid + query + salt + securityKey),
        };
        const requestBody = Object.entries(queryObj)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join("&");
        const response = await Spicetify.CosmosAsync.get(`https://fanyi-api.baidu.com/api/trans/vip/translate?${requestBody}`);
        let result = null;
        if (response.trans_result) {
            result = response.trans_result.map(item => item.dst);
            result = lyrics.map((item, index) => {
                return {startTime: item.startTime, text: result[index]}
            })
        }
        return result;
    }
};
