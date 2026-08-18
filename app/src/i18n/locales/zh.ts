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
      trending: '趋势',
      security: '安全预警',
      weekly: '周刊',
      method: '评分方法',
      about: '关于',
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
      weightNote: '维护 30% · 文档 25% · npm 30% · 生态 15%',
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
  method: {
    title: '评分方法',
    subtitle:
      '每个分数都由四个加权维度计算，数据来源为公开的 GitHub 与 npm 元数据。不掺人工判断，不接受付费排名。',
    cards: {
      maintenance: {
        name: '维护',
        weight: '30%',
        description: '近 90 天的提交频率、issue 响应与发布节奏。',
      },
      docs: {
        name: '文档',
        weight: '25%',
        description: 'README 完整性、dsh.bundle 声明与使用示例。',
      },
      npm: {
        name: 'npm',
        weight: '30%',
        description: 'npm 发布、版本稳定性与安装脚本安全性。',
      },
      ecosystem: {
        name: '生态',
        weight: '15%',
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
  sponsor: {
    label: '赞助',
    transparency:
      '广告位与推荐位均有明确标注，与评分、排名、安全评级完全隔离。任何付费位都不会影响评分。',
    policy: '广告政策',
  },
};

export default zh;
