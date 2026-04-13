function main(config) {
    const aiGroupName = "AI-Studio";
    const spotifyGroupName = "Spotify-US"; // 新增：Spotify专属策略组名称

    // 1. 确保配置基本结构存在，防止报错
    if (!config["proxies"]) config["proxies"] = [];
    if (!config["proxy-groups"]) config["proxy-groups"] = [];
    if (!config["rules"]) config["rules"] = [];

    // 2. 筛选节点
    // 2.1 筛选 AI 节点 (原有逻辑，仅匹配大写 AI)
    const aiNodes = config["proxies"]
        .map(proxy => proxy.name)
        .filter(name => 
            name.includes("AI") ||
            name.includes("gemini")
        );

    // 2.2 筛选 美国 节点 (新增逻辑)
    // 根据你机场的命名习惯，可以自行增删此处的关键字。
    // 这里使用了严格的大写 "US" 以及常见的美国地区中文名，防止误匹配（例如 plus, russia）
    const usNodes = config["proxies"]
        .map(proxy => proxy.name)
        .filter(name =>
            name.includes("美国") ||
            name.includes("US") ||
            name.includes("洛杉矶") ||
            name.includes("硅谷") ||
            name.includes("纽约") ||
            name.includes("西雅图")
        );

    // 3. 构建策略组的节点列表
    // 3.1 AI策略组节点
    let aiGroupProxies = [...aiNodes, "三毛机场", "DIRECT"];
    aiGroupProxies = Array.from(new Set(aiGroupProxies)); // 去重

    // 3.2 Spotify专属策略组节点
    // 把美国节点放前面，兜底选项放后面
    let spotifyGroupProxies = [...usNodes, "三毛机场", "DIRECT"];
    spotifyGroupProxies = Array.from(new Set(spotifyGroupProxies)); // 去重

    // 4. 注入专属策略组
    // 4.1 注入 AI 策略组
    const aiGroupIndex = config["proxy-groups"].findIndex(g => g.name === aiGroupName);
    if (aiGroupIndex === -1) {
        config["proxy-groups"].unshift({
            name: aiGroupName,
            type: "select",
            proxies: aiGroupProxies
        });
    } else {
        config["proxy-groups"][aiGroupIndex].proxies = aiGroupProxies;
    }

    // 4.2 注入 Spotify 策略组
    const spotifyGroupIndex = config["proxy-groups"].findIndex(g => g.name === spotifyGroupName);
    if (spotifyGroupIndex === -1) {
        config["proxy-groups"].unshift({
            name: spotifyGroupName,
            type: "select",
            proxies: spotifyGroupProxies
        });
    } else {
        config["proxy-groups"][spotifyGroupIndex].proxies = spotifyGroupProxies;
    }

    // 5. 注入路由规则 (必须放在最前面，防止被其他规则覆盖)
    // 5.1 AI 路由规则
    const aiRules = [
        `DOMAIN-SUFFIX,google.com,${aiGroupName}`,
        `DOMAIN-SUFFIX,googleapis.com,${aiGroupName}`
    ];

    // 5.2 Spotify 路由规则 (包含主域名以及必要的CDN，确保音乐能正常播放)
    const spotifyRules = [
        `DOMAIN-SUFFIX,spotify.com,${spotifyGroupName}`,       // Spotify 主域名及子域名
        `DOMAIN-SUFFIX,spotifycdn.com,${spotifyGroupName}`,    // Spotify 静态资源/音乐流
        `DOMAIN-SUFFIX,scdn.co,${spotifyGroupName}`            // Spotify 短链及CDN
    ];

    // 6. 清理并重组规则列表
    // 清理可能由于多次运行产生的重复旧规则，防止脚本重复执行导致规则无限膨胀
    const filteredRules = config["rules"].filter(
        rule => !rule.includes("google.com") &&
            !rule.includes("googleapis.com") &&
            !rule.includes("spotify.com") &&
            !rule.includes("spotifycdn.com") &&
            !rule.includes("scdn.co")
    );

    // 将新规则置顶注入（Spotify规则和AI规则放在系统所有规则的最前面）
    config["rules"] = [...spotifyRules, ...aiRules, ...filteredRules];

    return config;
}