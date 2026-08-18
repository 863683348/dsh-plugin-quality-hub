const en = {
  meta: {
    title: 'DSH Quality — Find plugins worth installing',
    description:
      'Independent scoring and real-time security watch for DeepSeek Harness plugins. Heuristic detection, not a substitute for code review.',
  },
  weekly: {
    section: {
      eyebrow: 'DSH Weekly',
      title: 'The plugin digest, every week',
      subtitle:
        'New releases, grade movers, security advisories and ecosystem stats — one email, every Friday.',
    },
    subscribe: {
      label: 'Email address',
      placeholder: 'you@example.com',
      cta: 'Subscribe',
      submitting: 'Subscribing...',
      successTitle: "You're on the list",
      successBody: 'First issue lands this Friday. See you there.',
      invalid: 'Please enter a valid email address.',
      error: 'Something went wrong. Please try again.',
      privacy: 'No spam. Unsubscribe anytime.',
    },
    share: {
      label: 'Share this issue',
      defaultTitle: 'DSH Weekly — Plugin quality digest',
      hn: 'Share on Hacker News',
      reddit: 'Share on Reddit',
    },
    hero: {
      badge: 'Launching soon',
      title: 'DSH Weekly',
      body: 'A weekly digest of the DeepSeek Harness plugin ecosystem: new plugins, grade changes, security advisories and community picks.',
      primary: 'Subscribe free',
    },
    content: {
      new: 'New plugins & grade movers',
      security: 'Security advisories',
      ecosystem: 'Ecosystem stats & picks',
    },
  },
  common: {
    brandName: 'DSH Quality',
    tagline: 'Plugin quality, measured.',
    nav: {
      topRated: 'Top Rated',
      allPlugins: 'All Plugins',
      trending: 'Trending',
      security: 'Security Watch',
      weekly: 'Weekly',
      method: 'Methodology',
      about: 'About',
    },
    language: 'Language',
    theme: {
      light: 'Light mode',
      dark: 'Dark mode',
    },
    actions: {
      browse: 'Browse Top Rated',
      howWeScore: 'How we score',
      viewOnGitHub: 'View on GitHub',
      backToHome: 'Back to home',
      retry: 'Retry',
      clearFilters: 'Clear filters',
      viewAll: 'View all',
    },
    footer: {
      brandDescription:
        'Independent scoring and security watch for the DeepSeek Harness plugin ecosystem.',
      quickLinks: 'Quick Links',
      disclaimer: 'Disclaimer',
      securityNotice:
        'Heuristic detection, not a substitute for code review. Always inspect install scripts before running them.',
      rights: 'All scores are heuristic estimates based on public metadata.',
    },
    time: {
      justNow: 'just now',
      minutesAgo: '{count} minutes ago',
      hoursAgo: '{count} hours ago',
      daysAgo: '{count} days ago',
      monthsAgo: '{count} months ago',
      yearsAgo: '{count} years ago',
    },
  },
  home: {
    hero: {
      eyebrow: 'DSH Plugin Quality',
      title: 'Find plugins worth installing',
      subtitle:
        'Independent scoring across maintenance, docs, npm and ecosystem health — plus real-time security warnings so you can skip the risky installs.',
      source: 'Scored from GitHub + npm metadata',
    },
    stats: {
      evaluated: 'Plugins evaluated',
      gradeA: 'Grade A plugins',
      activeAlerts: 'Active security alerts',
    },
    search: {
      placeholder: 'Search by name, author, or keyword...',
      emptyTitle: 'No plugins found',
      emptyBody: 'No plugins match your search. Try a different keyword.',
    },
    distribution: {
      title: 'Grade distribution',
      subtitle: 'Share of evaluated plugins by grade',
    },
    table: {
      rank: 'Rank',
      name: 'Plugin',
      grade: 'Grade',
      score: 'Score',
      stars: 'Stars',
      lastPush: 'Last push',
      security: 'Security',
      noFlags: 'None',
      error: 'Failed to load plugins',
      loading: 'Loading plugins...',
      prev: 'Previous',
      next: 'Next',
      page: 'Page {page} of {total}',
      empty: 'No plugins found',
    },
    lastUpdated: 'Last updated: {date} UTC',
  },
  plugin: {
    notFound: {
      title: 'Plugin not found',
      body: 'This plugin does not exist or has not been evaluated yet.',
    },
    breadcrumb: { home: 'Home' },
    scoreBreakdown: {
      title: 'Score breakdown',
      subtitle: 'Four weighted dimensions, independently computed',
      maintenance: 'Maintenance',
      docs: 'Docs',
      npm: 'npm',
      ecosystem: 'Ecosystem',
      weightNote: 'Maintenance 28% · Docs 28% · npm 24% · Ecosystem 20%',
      reasons: 'Deductions',
      noReasons: 'No deductions for this dimension.',
    },
    gradeCard: {
      total: 'Overall score',
      gradeLabel: 'Grade',
      outOf: '/100',
    },
    meta: {
      title: 'Metadata',
      author: 'Author',
      repository: 'Repository',
      lastPush: 'Last push',
      archived: 'Archived',
      notArchived: 'Active',
      updated: 'Updated',
    },
    flags: {
      title: 'Security flags',
      none: 'No security flags',
      noneDetail: 'No dangerous or suspicious patterns detected.',
    },
    npm: {
      title: 'npm package',
      version: 'Version',
      downloads: 'Downloads',
      notAvailable: 'Not published on npm',
    },
    related: {
      title: 'Related plugins',
      subtitle: 'Similar plugins worth a look',
    },
  },
  trending: {
    title: 'Trending',
    subtitle: 'Recently active plugins and the most starred in the ecosystem.',
    recentlyActive: 'Recently Active',
    recentlyActiveEmpty: 'No recently active plugins',
    mostStarred: 'Most Starred',
    mostStarredEmpty: 'No starred plugins',
    lastPush: 'Last push',
    stars: 'Stars',
  },
  plugins: {
    title: 'All Plugins',
    subtitle: 'Browse every evaluated plugin — {total} and counting. Search, filter by grade, and sort.',
    searchPlaceholder: 'Search by name, author, or keyword...',
    gradeFilter: {
      all: 'All grades',
    },
    table: {
      plugin: 'Plugin',
      score: 'Score',
      grade: 'Grade',
      stars: 'Stars',
      lastPush: 'Last push',
    },
    loading: 'Loading plugins...',
    error: 'Failed to load plugins',
    empty: 'No plugins found',
  },
  security: {
    title: 'Security Watch',
    subtitle:
      'Heuristic flags for dangerous install scripts, missing dsh.bundle declarations, and archived repositories.',
    filter: {
      all: 'All',
      danger: 'Danger',
      warning: 'Warning',
      info: 'Info',
    },
    legend: {
      title: 'Flag legend',
      danger: 'Dangerous install script',
      warning: 'Missing dsh.bundle declaration',
      info: 'Archived repository',
    },
    table: {
      plugin: 'Plugin',
      type: 'Flag',
      detail: 'Issue',
      grade: 'Grade',
      lastPush: 'Last push',
      empty: 'No flagged plugins match this filter',
      emptyAction: 'Clear filters',
      error: 'Failed to load security data',
      loading: 'Loading security data...',
    },
    notice: 'Heuristic detection, not a substitute for code review.',
    advisories: {
      tab: 'Advisories',
      flagsTab: 'Flags',
      searchPlaceholder: 'Search advisories...',
      severity: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      status: {
        all: 'All statuses',
        active: 'Active',
        investigating: 'Investigating',
        resolved: 'Resolved',
      },
      empty: 'No advisories match these filters.',
      detail: {
        affectedRange: 'Affected range',
        status: 'Status',
        description: 'Description',
        affectedPlugin: 'Affected plugin',
      },
      notice:
        'Advisories are published when a dangerous pattern is confirmed. Always inspect the code you run.',
    },
  },
  method: {
    title: 'How We Score Plugins',
    subtitle:
      'Every score is computed from four weighted dimensions using public GitHub and npm metadata. No human judgement, no paid placements.',
    cards: {
      maintenance: {
        name: 'Maintenance',
        weight: '28%',
        description:
          'Commit frequency, issue responsiveness, and release cadence over the last 90 days.',
      },
      docs: {
        name: 'Docs',
        weight: '28%',
        description:
          'README completeness, dsh.bundle declaration presence, and usage examples.',
      },
      npm: {
        name: 'npm',
        weight: '24%',
        description:
          'npm publishing, version stability, and install script safety.',
      },
      ecosystem: {
        name: 'Ecosystem',
        weight: '20%',
        description:
          'Stars, forks, and community activity around the repository.',
      },
    },
    weightTable: {
      title: 'Weight table',
      dimension: 'Dimension',
      weight: 'Weight',
      source: 'Data source',
      scoring: 'Scoring',
      rows: {
        maintenance: {
          source: 'GitHub API',
          scoring: 'Commit/issue/release recency',
        },
        docs: {
          source: 'GitHub API',
          scoring: 'README & dsh.bundle checks',
        },
        npm: {
          source: 'npm registry',
          scoring: 'Publish history & install script scan',
        },
        ecosystem: {
          source: 'GitHub API',
          scoring: 'Stars/forks normalized to log scale',
        },
      },
    },
    gradeLegend: {
      title: 'Grade legend',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      rangeA: '90–100',
      rangeB: '75–89',
      rangeC: '60–74',
      rangeD: '<60',
    },
    dangerRule: {
      title: 'Dangerous install script rule',
      body: 'If a plugin install script matches any of curl|sh, /dev/tcp, base64 -d, iex, or powershell -enc, it is flagged as danger and its grade can never exceed D.',
      patterns: 'Patterns scanned: curl|sh · /dev/tcp · base64 -d · iex · powershell -enc',
    },
    transparency: {
      title: 'Transparency',
      body: 'Every number on this site is derived from public data. Scores are recomputed weekly; flags are re-scanned on every refresh.',
    },
  },
  about: {
    title: 'About DSH Quality',
    why: {
      title: 'Why we built this',
      body: 'The DSH plugin ecosystem exploded — over 4,300 plugins in 3 days, yet only about 2% are high quality. With 216 tag-baiting projects capturing 23% of all stars and 4 high-severity vulnerabilities found within 45 hours, users had no independent way to tell what was worth installing.',
    },
    what: {
      title: 'What we do',
      body: 'We compute an independent health score from public GitHub and npm metadata, and surface security flags for risky install patterns. We never recommend and never install — we only measure.',
    },
    data: {
      title: 'Data sources',
      body: 'GitHub API and npm registry, refreshed weekly. Scores are heuristic estimates, not guarantees.',
    },
    limitations: {
      title: 'Limitations',
      body: 'Heuristic detection, not a substitute for code review. A clean flag does not mean a plugin is safe — always inspect the code you run.',
    },
    contact: {
      title: 'Get involved',
      body: 'Questions or feedback? Open an issue on GitHub.',
      link: 'GitHub repository',
    },
  },
  sponsor: {
    label: 'Sponsored',
    transparency:
      'Sponsored slots and promos are clearly labeled and completely separate from scoring, rankings, and security ratings. No paid placement ever influences a score.',
    policy: 'Advertising policy',
  },
};

export default en;
