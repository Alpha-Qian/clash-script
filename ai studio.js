function main(config) {
    const groupName = "AI-Studio";

    // 1. 确保配置基本结构存在，防止报错
    if (!config["proxies"]) config["proxies"] = [];
    if (!config["proxy-groups"]) config["proxy-groups"] = [];
    if (!config["rules"]) config["rules"] = [];

    // 2. 遍历所有代理节点，筛选出名称中包含大写 "AI" 的节点
    // 注意：这里区分大小写，只会匹配大写的 AI
    const aiNodes = config["proxies"]
        .map(proxy => proxy.name)
        .filter(name => name.includes("AI"));

    // 3. 构建策略组的节点列表
    // 把找到的 AI 节点放前面，"PROXY"(全局默认策略) 和 "DIRECT"(直连) 作为兜底选项放后面
    // 即使没有找到任何含 AI 的节点，也不会报错，会默认显示兜底选项
    let groupProxies = [...aiNodes, "三毛机场", "DIRECT"];

    // 去重（防御性编程，防止出现重复节点名）
    groupProxies = Array.from(new Set(groupProxies));

    // 4. 注入专属策略组
    const groupIndex = config["proxy-groups"].findIndex(g => g.name === groupName);
    if (groupIndex === -1) {
        // 如果不存在，则插入到策略组列表的最前面
        config["proxy-groups"].unshift({
            name: groupName,
            type: "select",
            proxies: groupProxies
        });
    } else {
        // 如果已经存在（某些复用场景），更新它的节点列表
        config["proxy-groups"][groupIndex].proxies = groupProxies;
    }

    // 5. 注入路由规则 (必须放在最前面，防止被其他规则覆盖)
    const aiRules = [
        //`DOMAIN-SUFFIX,aistudio.google.com,${groupName}`,
        //`DOMAIN-SUFFIX,generativelanguage.googleapis.com,${groupName}`,
        // === 🚀 核心修改：扩充拦截规则 ===
        //`DOMAIN-SUFFIX,ai.google.dev,${groupName}`,         // Google AI 开发者官网
        //`DOMAIN-SUFFIX,accounts.google.com,${groupName}`,   // Google 账号登录/验证（非常关键！）
        //`DOMAIN-SUFFIX,myaccount.google.com,${groupName}`,   // Google 账号管理
        `DOMAIN-SUFFIX,google.com,${groupName}`             //所有Google
    ];

    // 清理可能由于多次运行产生的重复旧规则
    const filteredRules = config["rules"].filter(
        rule => !rule.includes("google.com")//!rule.includes("aistudio.google.com") && !rule.includes("generativelanguage.googleapis.com")
    );

    // 将新规则置顶
    config["rules"] = [...aiRules, ...filteredRules];

    return config;
}