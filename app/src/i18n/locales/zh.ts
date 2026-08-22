const zh = {
  meta: {
    title: 'DSH Quality — 找到值得安装的插件',
    description:
      'DeepSeek Harness 插件独立评分与实时安全预警。启发式检测，不能替代代码审查。',
  },
  weekly: {
    section: {
      eyebrow: 'DSH Weekly',
      title: '每周插件精选',
      subtitle:
        '新插件、评分变动、安全公告与生态数据——每周五一封邮件，全部掌握。',
    },
    subscribe: {
      label: '邮箱地址',
      placeholder: 'you@example.com',
      cta: '订阅',
      submitting: '订阅中…',
      successTitle: '订阅成功',
      successBody: '第一期将在本周五送达，敬请期待。',
      invalid: '请输入有效的邮箱地址。',
      error: '出错了，请稍后重试。',
      privacy: '无垃圾邮件，随时可退订。',
    },
    share: {
      label: '分享本期',
      defaultTitle: 'DSH Weekly — 插件质量精选',
      hn: '分享到 Hacker News',
      reddit: '分享到 Reddit',
    },
    hero: {
      badge: '即将上线',
      title: 'DSH Weekly',
      body: 'DeepSeek Harness 插件生态每周精选：新插件、评分变动、安全公告与社区推荐。',
      primary: '免费订阅',
    },
    content: {
      new: '新插件与评分变动',
      security: '安全公告',
      ecosystem: '生态数据与社区精选',
    },
  },
  common: {
    brandName: 'DSH Quality',
    tagline: '插件质量，可量化。',
    nav: {
      topRated: '排行榜',
      allPlugins: '全部插件',
      tutorials: '教程',
      examples: '实例',
      trending: '趋势',
      security: '安全预警',
      lowQuality: '低质量区',
      weekly: '周刊',
      method: '评分方法',
      about: '关于',
      pricing: '价格',
    },
    language: '语言',
    theme: {
      light: '浅色模式',
      dark: '深色模式',
    },
    actions: {
      browse: '浏览排行榜',
      howWeScore: '评分方法',
      viewOnGitHub: '在 GitHub 查看',
      backToHome: '返回首页',
      retry: '重试',
      clearFilters: '清除筛选',
      viewAll: '查看全部',
    },
    footer: {
      brandDescription:
        'DeepSeek Harness 插件生态的独立评分与安全预警平台。',
      quickLinks: '快速链接',
      disclaimer: '免责声明',
      securityNotice:
        '启发式检测，不能替代代码审查。运行安装脚本前请务必检查其内容。',
      rights: '所有评分均为基于公开元数据的启发式估算。',
      legal: {
        title: '法律与支持',
        privacy: '隐私政策',
        terms: '服务条款',
        faq: '常见问题',
        blog: '博客',
        contact: '联系我们',
      },
    },
    time: {
      justNow: '刚刚',
      minutesAgo: '{count} 分钟前',
      hoursAgo: '{count} 小时前',
      daysAgo: '{count} 天前',
      monthsAgo: '{count} 个月前',
      yearsAgo: '{count} 年前',
    },
  },
  tutorials: {
    meta: {
      title: 'DSH 插件教程 — 动手学会构建',
      description:
        '手把手教你构建 DeepSeek Harness 插件：从第一个 apply(ctx, config) 到发布到 dsh-plugin topic 并拿到评分。',
    },
    section: {
      eyebrow: '教程',
      title: '动手学会 DSH',
      subtitle:
        '以构建者视角写的实战指南，不是文档复读。每篇指南都关联 Hub 上真实评分的插件。',
    },
    filter: {
      all: '全部难度',
      beginner: '入门',
      intermediate: '进阶',
      advanced: '高级',
    },
    level: {
      beginner: '入门',
      intermediate: '进阶',
      advanced: '高级',
    },
    metaLabels: {
      level: '难度',
      reading: '阅读时长',
    },
    relatedExamples: '相关实例',
    relatedPlugins: '相关评分插件',
    notFound: {
      title: '教程不存在',
      body: '这篇教程不存在或尚未发布。',
    },
    backToList: '全部教程',
    updated: '最后更新：{date}',
  },
  examples: {
    meta: {
      title: 'DSH 插件实例 — 真实插件拆解',
      description:
        '真实 DeepSeek Harness 插件的拆解：配置片段、核心代码逻辑与评分亮点，全部由 DSH Quality 评分数据背书。',
    },
    section: {
      eyebrow: '实例',
      title: '真实插件，逐层拆解',
      subtitle:
        '真实 DSH 插件的配置片段、核心代码逻辑与评分亮点——每个实例都链接到 Hub 上的评分。',
    },
    category: {
      'ui-enhancements': 'UI 增强',
      'themes-appearance': '主题与外观',
      'sessions-messages': '会话与消息',
      memory: '记忆',
      'tools-capabilities': '工具与能力',
      skills: '技能包',
      'workflow-automation': '工作流与自动化',
      'notifications-integrations': '通知与集成',
      'models-accounts': '模型与账号接入',
      'dev-runtime': '开发与运行时',
      entertainment: '娱乐',
    },
    dims: {
      config: '配置片段',
      code: '核心代码',
      highlights: '为何高分',
    },
    viewOnHub: '在 Hub 查看',
    viewOnGitHub: '在 GitHub 查看',
    plugin: '插件',
    relatedTutorials: '相关教程',
    notFound: {
      title: '实例不存在',
      body: '这个实例不存在或尚未发布。',
    },
    backToList: '全部实例',
  },
  home: {
    hero: {
      eyebrow: 'DSH 插件质量',
      title: '找到值得安装的插件',
      subtitle:
        '基于维护、文档、npm 与生态健康的独立评分，加上实时安全预警，帮你避开有风险的安装。',
      source: '评分来源：GitHub + npm 元数据',
    },
    stats: {
      evaluated: '已评估插件',
      gradeA: 'A 级插件',
      activeAlerts: '活跃安全预警',
    },
    search: {
      placeholder: '按名称、作者或关键词搜索…',
      emptyTitle: '未找到插件',
      emptyBody: '没有匹配的插件，试试其他关键词。',
    },
    distribution: {
      title: '等级分布',
      subtitle: '已评估插件的等级占比',
    },
    table: {
      rank: '排名',
      name: '插件',
      grade: '等级',
      score: '分数',
      stars: 'Stars',
      lastPush: '最后推送',
      security: '安全',
      noFlags: '无',
      error: '插件加载失败',
      loading: '正在加载插件…',
      prev: '上一页',
      next: '下一页',
      page: '第 {page} / {total} 页',
      empty: '未找到插件',
    },
    lastUpdated: '最后更新：{date} UTC',
  },
  plugin: {
    notFound: {
      title: '未找到插件',
      body: '该插件不存在或尚未被评估。',
    },
    breadcrumb: { home: '首页' },
    scoreBreakdown: {
      title: '评分拆解',
      subtitle: '四个加权维度，独立计算',
      maintenance: '维护',
      docs: '文档',
      npm: 'npm',
      ecosystem: '生态',
      weightNote: '维护 28% · 文档 28% · npm 24% · 生态 20%',
      reasons: '扣分原因',
      noReasons: '该维度无扣分。',
    },
    gradeCard: {
      total: '综合评分',
      gradeLabel: '等级',
      outOf: '/100',
    },
    meta: {
      title: '元信息',
      author: '作者',
      repository: '仓库',
      lastPush: '最后推送',
      archived: '已归档',
      notArchived: '活跃',
      updated: '更新时间',
    },
    flags: {
      title: '安全标记',
      none: '无安全标记',
      noneDetail: '未检测到危险或可疑模式。',
    },
    npm: {
      title: 'npm 包',
      version: '版本',
      downloads: '下载量',
      notAvailable: '未发布到 npm',
    },
    related: {
      title: '相关插件',
      subtitle: '值得一看的相似插件',
    },
    buildYourOwn: {
      title: '自己动手做插件',
      body: '从第一个 apply(ctx, config) 到发布到 dsh-plugin topic 并拿到评分，学会从零构建 DSH 插件。',
      cta: '浏览教程',
    },
    badge: {
      title: '质量徽章',
      subtitle: '在你的 README 上展示 DSH 质量等级。',
      preview: '徽章预览',
      markdownLabel: 'Markdown',
      htmlLabel: 'HTML',
      copy: '复制',
      copied: '已复制！',
      hint: '将这段代码粘贴到插件 README 中即可展示质量等级。',
    },
  },
  trending: {
    title: '趋势',
    subtitle: '最近活跃的插件与生态中最受关注的插件。',
    recentlyActive: '最近活跃',
    recentlyActiveEmpty: '暂无最近活跃插件',
    mostStarred: '最多 Star',
    mostStarredEmpty: '暂无 Star 数据',
    lastPush: '最后推送',
    stars: 'Stars',
  },
  plugins: {
    title: '全部插件',
    subtitle: '浏览所有已评估插件——已有 {total} 个，持续更新中。支持搜索、等级筛选与排序。',
    searchPlaceholder: '按名称、作者或关键词搜索…',
    gradeFilter: {
      all: '全部等级',
    },
    table: {
      plugin: '插件',
      score: '分数',
      grade: '等级',
      stars: 'Stars',
      lastPush: '最后推送',
    },
    loading: '正在加载插件…',
    error: '插件加载失败',
    empty: '未找到插件',
  },
  security: {
    title: '安全预警',
    subtitle:
      '对危险安装脚本、缺失 dsh.bundle 声明和归档仓库的启发式标记。',
    filter: {
      all: '全部',
      danger: '危险',
      warning: '警告',
      info: '提示',
    },
    legend: {
      title: '标记图例',
      danger: '危险安装脚本',
      warning: '缺失 dsh.bundle 声明',
      info: '仓库已归档',
    },
    table: {
      plugin: '插件',
      type: '标记',
      detail: '问题说明',
      grade: '等级',
      lastPush: '最后推送',
      empty: '没有符合该筛选条件的标记插件',
      emptyAction: '清除筛选',
      error: '安全数据加载失败',
      loading: '正在加载安全数据…',
    },
    notice: '启发式检测，不能替代代码审查。',
    advisories: {
      tab: '安全公告',
      flagsTab: '标记列表',
      searchPlaceholder: '搜索公告…',
      severity: {
        critical: '严重',
        high: '高危',
        medium: '中危',
        low: '低危',
      },
      status: {
        all: '全部状态',
        active: '活跃',
        investigating: '调查中',
        resolved: '已解决',
      },
      empty: '没有符合筛选条件的公告。',
      detail: {
        affectedRange: '影响范围',
        status: '状态',
        description: '描述',
        affectedPlugin: '受影响插件',
      },
      notice:
        '公告在确认危险模式后发布。运行前请务必检查代码。',
    },
  },
  lowQuality: {
    title: '低质量插件观察区',
    subtitle:
      '在维护、文档、npm 集成和生态健康四个维度得分极低的插件。请谨慎使用——或干脆避免。',
    warningBanner:
      '以下部分条目是合成示例，不是真实 GitHub 仓库。它们的存在纯粹是为了教你识别低质量插件长什么样。请勿在真实环境中安装。',
    syntheticBadge: '合成示例',
    realBadge: '真实插件 · 低分',
    table: {
      plugin: '插件',
      grade: '等级',
      score: '分数',
      stars: '星标',
      flags: '警告标记',
      empty: '暂未收录低质量插件。',
    },
    why: {
      title: '插件为何会进入这里',
      points: [
        '危险安装脚本（curl | sh、base64 载荷等）',
        '缺失 dsh.bundle 声明或文档',
        '数月无活动的过时仓库',
        '缺少许可证或 README',
        '星标极少、缺乏真实社区信号',
      ],
    },
    notice:
      '合成示例按确定性规则生成，仅供教学。真实条目为从实时数据库标记出的 D 级插件。',
  },
  method: {
    title: '评分方法',
    subtitle:
      '每个分数都由四个加权维度计算，数据来源为公开的 GitHub 与 npm 元数据。不掺人工判断，不接受付费排名。',
    cards: {
      maintenance: {
        name: '维护',
        weight: '28%',
        description: '近 90 天的提交频率、issue 响应与发布节奏。',
      },
      docs: {
        name: '文档',
        weight: '28%',
        description: 'README 完整性、dsh.bundle 声明与使用示例。',
      },
      npm: {
        name: 'npm',
        weight: '24%',
        description: 'npm 发布、版本稳定性与安装脚本安全性。',
      },
      ecosystem: {
        name: '生态',
        weight: '20%',
        description: '仓库的 star、fork 与社区活跃度。',
      },
    },
    weightTable: {
      title: '权重表',
      dimension: '维度',
      weight: '权重',
      source: '数据来源',
      scoring: '计分方式',
      rows: {
        maintenance: {
          source: 'GitHub API',
          scoring: '提交 / issue / 发布活跃度',
        },
        docs: {
          source: 'GitHub API',
          scoring: 'README 与 dsh.bundle 检查',
        },
        npm: {
          source: 'npm registry',
          scoring: '发布历史与安装脚本扫描',
        },
        ecosystem: {
          source: 'GitHub API',
          scoring: 'star / fork 对数归一化',
        },
      },
    },
    gradeLegend: {
      title: '等级划分',
      excellent: '优秀',
      good: '良好',
      fair: '一般',
      poor: '差',
      rangeA: '90–100',
      rangeB: '75–89',
      rangeC: '60–74',
      rangeD: '<60',
    },
    dangerRule: {
      title: '危险安装脚本规则',
      body: '如果插件的安装脚本命中 curl|sh、/dev/tcp、base64 -d、iex 或 powershell -enc 中的任意模式，将被标记为危险，且等级不得超过 D。',
      patterns: '扫描模式：curl|sh · /dev/tcp · base64 -d · iex · powershell -enc',
    },
    transparency: {
      title: '透明性',
      body: '本站的每个数字都来自公开数据。评分每周重算，标记在每次刷新时重新扫描。',
    },
  },
  about: {
    title: '关于 DSH Quality',
    why: {
      title: '为什么做这个',
      body: 'DSH 插件生态迎来爆发——3 天新增 4300+ 插件，优质仅约 2%。216 个蹭标签项目拿走了 23% 的星标，4 个高严重漏洞在 45 小时内被发现。用户缺少独立判断哪些插件值得安装的手段。',
    },
    what: {
      title: '我们做什么',
      body: '我们基于公开的 GitHub 与 npm 元数据计算独立健康评分，并对危险的安装模式给出安全标记。我们从不推荐、从不安装——只做测量。',
    },
    data: {
      title: '数据来源',
      body: 'GitHub API 与 npm registry，每周自动更新。评分为启发式估算，不构成保证。',
    },
    limitations: {
      title: '局限性',
      body: '启发式检测，不能替代代码审查。没有标记不代表插件安全——运行前请务必检查代码。',
    },
    contact: {
      title: '参与进来',
      body: '有问题或反馈？欢迎在 GitHub 提 issue。',
      link: 'GitHub 仓库',
    },
  },
  pricing: {
    meta: {
      title: '价格方案 — DSH Quality Pro',
      description:
        'DSH Quality Pro 解锁完整教程、深度实例与进阶安全洞察。支持按月或按年订阅。',
    },
    hero: {
      badge: '会员',
      title: 'DSH Quality Pro',
      subtitle:
        '完整访问深度教程、全部实例，以及我们用于保持 DSH Quality 独立与少广告的工具。',
    },
    billing: {
      monthly: '按月',
      yearly: '按年',
      save: '省 $10',
    },
    free: {
      name: '免费',
      price: '$0',
      period: '永久',
      description:
        '评估插件所需的一切：排行榜、安全预警，以及每篇教程与实例的预览。',
      cta: '免费开始',
      features: [
        'Top Rated 与 Trending 排行榜',
        'Security Watch 安全预警',
        '每篇教程与实例的预览',
        '每周通讯',
      ],
    },
    pro: {
      name: 'Pro',
      priceMonthly: '$9',
      priceYearly: '$98',
      priceYearlyOld: '$108',
      period: '/月',
      periodYearly: '/年',
      description:
        '全部内容，全部解锁。完整教程与实例，外加对你所运行生态的优先支持。',
      cta: '升级到 Pro',
      ctaActive: '当前方案',
      ctaLogin: '登录后升级',
      features: [
        '完整访问每篇教程与实例',
        '完整代码示例与逐步讲解',
        '无广告阅读体验',
        '支持独立的插件评分',
      ],
    },
    note: {
      taxes: '价格为美元。税费可能因地区而异。',
      cancel: '随时取消，无隐藏费用。',
      mo: '/月',
      yr: '/年',
    },
    comparison: {
      title: '对比方案',
      subtitle: '评估插件所需的一切，以及深入探索所需的一切。',
      rows: [
        { label: '排行榜与趋势', free: '✓', pro: '✓' },
        { label: '安全预警', free: '✓', pro: '✓' },
        { label: '教程与实例预览', free: '✓', pro: '✓' },
        { label: '完整教程与实例', free: '—', pro: '✓' },
        { label: '完整代码示例', free: '—', pro: '✓' },
        { label: '无广告', free: '—', pro: '✓' },
      ],
    },
    faq: {
      title: '常见问题',
      subtitle: '关于 Pro 你可能想知道的一切。',
      items: [
        {
          q: '如何扣费？',
          a: 'Pro 通过我们的支付伙伴 waffo 计费，安全处理支付并开具收据。按月方案每月续费；按年方案每年续费一次。你可以随时取消。',
        },
        {
          q: '可以随时取消吗？',
          a: '可以。取消后，在当前计费周期结束前你仍可使用 Pro。无需长期承诺。',
        },
        {
          q: '为什么需要收费？',
          a: 'DSH Quality 保持独立，不受付费排名影响。会员费用直接支持评分、安全研究以及让生态更透明的内容创作。',
        },
        {
          q: '你们会保存我的银行卡吗？',
          a: '不会。支付完全由 waffo 处理，我们永远不会看到或存储你的卡号。',
        },
      ],
    },
    bottom: {
      title: '准备好深入探索了吗？',
      body: '加入支持独立插件评分的会员，获得 DSH Quality 内容库的完整访问权限。',
      cta: '立即获取 Pro',
    },
  },
  membership: {
    gate: {
      title: 'Pro 内容',
      body: '本完整教程仅供 Pro 会员。升级后即可阅读完整讲解。',
      cta: '升级到 Pro',
      signIn: '登录',
      loading: '正在解锁内容…',
      fetching: '正在为你加载完整内容…',
    },
    nav: {
      login: '登录',
      account: '账户',
      upgrade: '升级',
      pro: 'Pro',
    },
    login: {
      title: '登录',
      subtitle: '使用你的 Google 账号登录，以管理会员并解锁 Pro 内容。',
      google: '使用 Google 继续',
      note: '继续即表示你同意我们的服务条款与隐私政策。',
      error: '出错了，请重试。',
      backToPricing: '返回价格页',
    },
    account: {
      title: '你的账户',
      signedInAs: '已登录为',
      plan: '方案',
      status: '状态',
      statusActive: '已生效',
      statusNone: '无有效订阅',
      planFree: '免费',
      planPro: 'Pro',
      renew: '管理订阅',
      cancel: '取消订阅',
      canceling: '取消中…',
      cancelNote: '取消后，在当前计费周期结束前你仍可使用 Pro。',
      cancelError: '取消失败，请重试。',
      upgrade: '升级到 Pro',
      back: '返回网站',
      logout: '退出登录',
      loading: '正在加载你的账户…',
      signInFirst: '请先登录以查看和管理你的会员。',
      signInCta: '使用 Google 登录',
      renewsOn: '下次续费日期',
      logoutNote: '在此设备上退出登录。',
    },
  },
  sponsor: {
    label: '赞助',
    transparency:
      '广告位与推荐位均有明确标注，与评分、排名、安全评级完全隔离。任何付费位都不会影响评分。',
    policy: '广告政策',
  },
  legal: {
    privacy: {
      title: '隐私政策',
      updated: '最后更新：2026 年 8 月 18 日',
      intro:
        'DSH Quality（"我们"）运营 DSH Quality 网站（"本服务"）。本隐私政策说明我们收集哪些信息、如何使用这些信息，以及你拥有的选择。',
      sections: [
        {
          title: '我们收集的信息',
          body: '我们只收集最少量的信息：你在订阅 DSH Weekly 时提供的邮箱地址，以及通过隐私友好的分析工具收集的标准统计信息（页面浏览量、来源、大致位置、设备类型）。我们不收集你的姓名、电话号码或任何其他个人数据。',
        },
        {
          title: '信息的使用方式',
          body: '邮箱地址仅用于向你发送所订阅的周刊。统计数据以聚合形式用于了解哪些页面有用，并改进本服务。我们绝不会向第三方出售、出租或分享你的个人信息。',
        },
        {
          title: '订阅服务',
          body: '如果你订阅了 DSH Weekly，我们会保存你的邮箱地址以发送周刊。你可以随时通过每封邮件底部的退订链接退订，我们会在收到请求后及时从列表中删除你的地址。',
        },
        {
          title: 'Cookie 与分析',
          body: '本服务使用最少的 Cookie 或本地存储来保存主题偏好与语言选择。分析脚本可能设置 Cookie 以区分独立访客。你可以在浏览器设置中屏蔽 Cookie，不会影响核心功能的正常使用。',
        },
        {
          title: '数据保留',
          body: '订阅者的邮箱地址会保留至你退订为止。统计数据以聚合形式保留最多 26 个月，之后自动删除。',
        },
        {
          title: '你的权利',
          body: '你可以随时联系我们，请求访问、更正或删除你的个人数据。我们会在 30 天内响应所有合理请求。',
        },
        {
          title: '安全',
          body: '我们采取合理的技术与组织措施保护你的数据，包括加密传输（HTTPS）与数据库访问限制。任何传输方式都无法做到 100% 安全，因此我们无法保证绝对安全。',
        },
        {
          title: '未成年人',
          body: '本服务不面向 13 岁以下的儿童，我们也不会故意收集儿童的个人数据。如果你认为有儿童向我们提供了个人数据，请联系我们以便删除。',
        },
        {
          title: '政策变更',
          body: '我们可能会不时更新本隐私政策。重大变更将发布在本页面，并更新"最后更新"日期。',
        },
        {
          title: '联系我们',
          body: '如果你对本隐私政策有任何疑问，请通过 ahmedlzany423@gmail.com 联系我们。',
        },
      ],
    },
    terms: {
      title: '服务条款',
      updated: '最后更新：2026 年 8 月 18 日',
      intro:
        '访问或使用 DSH Quality 网站（"本服务"）即表示你同意受本服务条款约束。如果不同意，请勿使用本服务。',
      sections: [
        {
          title: '本服务',
          body: 'DSH Quality 基于公开的 GitHub 与 npm 元数据，为 DeepSeek Harness（DSH）插件提供独立的启发式评分与安全信号。本服务展示的信息仅用于教育与非商业目的。',
        },
        {
          title: '不构成专业建议',
          body: '所有评分、等级与安全标记均为基于公开元数据的启发式估算。它们不是质量或安全的保证，也不构成专业、法律、财务或安全建议。运行前请务必检查代码。',
        },
        {
          title: '准确性与可用性',
          body: '我们力求信息准确且及时，但不保证任何信息的完整性、准确性或时效性。本服务可能因维护或我们无法控制的因素而暂时不可用。',
        },
        {
          title: '可接受的使用',
          body: '你同意不滥用本服务，包括尝试未经授权访问、以滥用性规模抓取数据、干扰本服务运行，或将其用于任何非法目的。',
        },
        {
          title: '知识产权',
          body: '本服务及其代码、原创内容均以开源条款授权。插件名称、Logo 与仓库内容归各自所有者所有。展示的数据来自公开来源，并受该来源条款约束。',
        },
        {
          title: '责任限制',
          body: '本服务按"现状"与"可用"提供，不附带任何明示或默示的保证。在法律允许的最大范围内，我们不对因使用本服务而产生的任何损害承担责任，包括基于本站评分或标记所作出的决策。',
        },
        {
          title: '第三方链接',
          body: '本服务可能链接到第三方网站（如 GitHub、npm）。我们不对这些网站的内容或行为负责。',
        },
        {
          title: '条款变更',
          body: '我们可能随时通过更新本页面来修订本服务条款。变更后继续使用本服务即视为接受修订后的条款。',
        },
        {
          title: '适用法律',
          body: '本条款受服务运营方所在司法辖区的法律管辖，不考虑法律冲突原则。',
        },
        {
          title: '联系我们',
          body: '对本服务条款有疑问？请通过 ahmedlzany423@gmail.com 联系我们。',
        },
      ],
    },
    faq: {
      title: '常见问题',
      subtitle: '关于 DSH Quality、评分与安全信号的常见问题。',
      items: [
        {
          q: '什么是 DSH Quality？',
          a: 'DSH Quality 是一个独立平台，基于公开的 GitHub 与 npm 元数据为 DeepSeek Harness（DSH）插件评分，并对危险的安装模式给出安全信号。我们只做测量，不推荐、不安装。',
        },
        {
          q: '插件评分是如何计算的？',
          a: '每个插件都按四个加权维度评分：维护（28%）、文档（28%）、npm（24%）与生态（20%）。评分是基于公开元数据定期重算的启发式估算。',
        },
        {
          q: 'A、B、C、D 等级分别代表什么？',
          a: 'A（90–100）为优秀，B（75–89）为良好，C（60–74）为一般，D（<60）为较差。被标记为危险安装脚本的插件等级永远不会超过 D。',
        },
        {
          q: '什么是安全标记？',
          a: '安全标记是基于可检测模式的启发式警告：危险安装脚本（如 curl|sh、base64 -d、powershell -enc）、缺失 dsh.bundle 声明，以及已归档的仓库。标记不构成恶意的证明。',
        },
        {
          q: '没有标记的插件就安全吗？',
          a: '不一定。启发式检测无法覆盖所有情况。安装前请务必检查安装脚本与代码，并核实插件作者的可靠性。',
        },
        {
          q: '数据多久更新一次？',
          a: '评分按周定期重算，安全标记在每次刷新时重新扫描。新插件会随着生态更新持续纳入评估。',
        },
        {
          q: '如何提交插件或申请重新评分？',
          a: '插件从公开来源自动发现。如果某个插件缺失或元数据看起来有误，请附上仓库链接联系我们，我们会核查处理。',
        },
        {
          q: '付费推广会影响评分吗？',
          a: '不会。广告位与推荐位均有明确标注，与评分、排名、安全评级完全隔离。任何付费位都不会影响评分。',
        },
        {
          q: '如何退订周刊？',
          a: '每封 DSH Weekly 邮件底部都包含退订链接。点击即可立即从列表移除。',
        },
        {
          q: '如何联系你们？',
          a: '请发送邮件至 ahmedlzany423@gmail.com。如需功能建议或反馈 bug，也可以在 GitHub 仓库提交 issue。',
        },
      ],
    },
    blog: {
      title: '博客',
      subtitle: 'DSH 插件生态笔记：分析、评分深度解读与安全发现。',
      comingSoon: '更多文章正在路上——订阅 DSH Weekly 第一时间获取。',
      posts: [
        {
          title: '欢迎来到 DSH Quality',
          date: '2026 年 8 月 18 日',
          excerpt:
            '我们为什么为 DeepSeek Harness 插件生态构建独立的质量评分——以及为什么启发式检测只是故事的一半。',
        },
        {
          title: '解读 DSH 插件的爆发式增长',
          date: '2026 年 8 月 18 日',
          excerpt:
            '生态在几天内增长到 4300+ 插件。我们拆解数据、蹭标签问题，以及它对安装者意味着什么。',
        },
        {
          title: '安装脚本扫描是如何工作的',
          date: '2026 年 8 月 18 日',
          excerpt:
            '走进我们的危险模式扫描器：它检查什么、会漏掉什么，以及如何负责任地解读结果。',
        },
        {
          title: '为什么独立评分胜过自荐评级',
          date: '2026 年 8 月 22 日',
          excerpt:
            '星星和自荐评级可能被操纵。我们的独立评分使用真实数据——维护活动、文档质量、npm 健康度——给你一个 unbiased 的插件质量视图。',
        },
      ],
    },
    contact: {
      title: '联系我们',
      subtitle: '有疑问、反馈，或想让某个插件被复查？我们每封邮件都会认真阅读。',
      email: '邮箱',
      emailAddress: 'ahmedlzany423@gmail.com',
      emailBody:
        '如需最快响应，请发送邮件至 ahmedlzany423@gmail.com。我们通常会在 2–3 个工作日内回复。',
      github: 'GitHub',
      githubBody: '发现了 bug 或想参与贡献？欢迎在仓库提交 issue 或 pull request。',
      githubLink: '打开仓库',
      response: '建议附上的信息',
      responseBody:
        '插件相关问题请附上仓库链接，如有可能再附上本站显示的插件名称。周刊问题请附上订阅时使用的邮箱地址。',
      privacyNote: '我们绝不会将你的邮箱地址或个人数据分享给任何人。',
    },
  },
};

export default zh;
