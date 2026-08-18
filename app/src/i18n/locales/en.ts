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
      tutorials: 'Tutorials',
      examples: 'Examples',
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
      legal: {
        title: 'Legal',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        faq: 'FAQ',
        blog: 'Blog',
        contact: 'Contact Us',
      },
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
  tutorials: {
    meta: {
      title: 'DSH Plugin Tutorials — Learn by building',
      description:
        'Hands-on tutorials for building DeepSeek Harness plugins: from your first apply(ctx, config) to publishing on the dsh-plugin topic.',
    },
    section: {
      eyebrow: 'Tutorials',
      title: 'Learn DSH by building',
      subtitle:
        'Practical guides written from the builder perspective — not documentation rehashes. Every guide links to real plugins rated on the Hub.',
    },
    filter: {
      all: 'All levels',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    level: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    metaLabels: {
      level: 'Level',
      reading: 'Read time',
    },
    relatedExamples: 'Related examples',
    relatedPlugins: 'Related rated plugins',
    notFound: {
      title: 'Tutorial not found',
      body: 'This tutorial does not exist or is not published yet.',
    },
    backToList: 'All tutorials',
    updated: 'Last updated: {date}',
  },
  examples: {
    meta: {
      title: 'DSH Plugin Examples — Real plugin teardowns',
      description:
        'Teardowns of real DeepSeek Harness plugins: config fragments, core code logic and scoring highlights backed by DSH Quality rating data.',
    },
    section: {
      eyebrow: 'Examples',
      title: 'Real plugins, taken apart',
      subtitle:
        'Config fragments, core code logic and scoring highlights from real DSH plugins — each linked to its rating on the Hub.',
    },
    category: {
      'ui-enhancements': 'UI Enhancements',
      'themes-appearance': 'Themes & Appearance',
      'sessions-messages': 'Sessions & Messages',
      memory: 'Memory',
      'tools-capabilities': 'Tools & Capabilities',
      skills: 'Skills',
      'workflow-automation': 'Workflow & Automation',
      'notifications-integrations': 'Notifications & Integrations',
      'models-accounts': 'Models & Accounts',
      'dev-runtime': 'Development & Runtime',
      entertainment: 'Entertainment',
    },
    dims: {
      config: 'Config fragment',
      code: 'Core code',
      highlights: 'Why it scores',
    },
    viewOnHub: 'View on Hub',
    plugin: 'Plugin',
    relatedTutorials: 'Related tutorials',
    notFound: {
      title: 'Example not found',
      body: 'This example does not exist or is not published yet.',
    },
    backToList: 'All examples',
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
    buildYourOwn: {
      title: 'Build your own plugin',
      body: 'Learn to create DSH plugins from scratch — from your first apply(ctx, config) to publishing on the dsh-plugin topic and getting rated.',
      cta: 'Browse tutorials',
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
  legal: {
    privacy: {
      title: 'Privacy Policy',
      updated: 'Last updated: August 18, 2026',
      intro:
        'DSH Quality ("we", "us", or "our") operates the DSH Quality website (the "Service"). This Privacy Policy explains what information we collect, how we use it, and the choices you have.',
      sections: [
        {
          title: 'Information we collect',
          body: 'We collect minimal information: the email address you provide when subscribing to DSH Weekly, and standard analytics data (page views, referrer, approximate location, device type) collected through privacy-respecting analytics. We do not collect your name, phone number, or any other personal data.',
        },
        {
          title: 'How we use information',
          body: 'Email addresses are used only to deliver the weekly newsletter you subscribed to. Analytics data is used in aggregate to understand which pages are useful and to improve the Service. We never sell, rent, or share your personal information with third parties.',
        },
        {
          title: 'Newsletter service',
          body: 'If you subscribe to DSH Weekly, we store your email address to send the newsletter. You can unsubscribe at any time using the unsubscribe link in every email, and we will delete your address from our list promptly.',
        },
        {
          title: 'Cookies and analytics',
          body: 'The Service uses minimal cookies or local storage for theme preferences and language selection. Analytics scripts may set cookies to distinguish unique visitors. You can block cookies in your browser settings without losing access to core functionality.',
        },
        {
          title: 'Data retention',
          body: 'Newsletter subscriber emails are kept until you unsubscribe. Analytics data is retained in aggregated form for up to 26 months, after which it is automatically deleted.',
        },
        {
          title: 'Your rights',
          body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us. We respond to all legitimate requests within 30 days.',
        },
        {
          title: 'Security',
          body: 'We follow reasonable technical and organizational measures to protect your data, including encrypted transmission (HTTPS) and restricted access to databases. No method of transmission is 100% secure, so we cannot guarantee absolute security.',
        },
        {
          title: 'Children',
          body: 'The Service is not directed at children under 13, and we do not knowingly collect personal data from children. If you believe a child has provided us personal data, please contact us so we can delete it.',
        },
        {
          title: 'Changes to this policy',
          body: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with a revised "Last updated" date.',
        },
        {
          title: 'Contact us',
          body: 'If you have any questions about this Privacy Policy, please contact us at ahmedlzany423@gmail.com.',
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      updated: 'Last updated: August 18, 2026',
      intro:
        'By accessing or using the DSH Quality website (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.',
      sections: [
        {
          title: 'The Service',
          body: 'DSH Quality provides independent, heuristic scoring and security signals for DeepSeek Harness (DSH) plugins, computed from public GitHub and npm metadata. The Service displays information for educational and informational purposes only.',
        },
        {
          title: 'No professional advice',
          body: 'All scores, grades, and security flags are heuristic estimates derived from public metadata. They are not guarantees of quality or safety, and they do not constitute professional, legal, financial, or security advice. Always inspect the code you run.',
        },
        {
          title: 'Accuracy and availability',
          body: 'We strive to keep information accurate and up to date, but we do not warrant that any information is complete, accurate, or current. The Service may be temporarily unavailable for maintenance or due to factors beyond our control.',
        },
        {
          title: 'Acceptable use',
          body: 'You agree not to misuse the Service, including attempting to gain unauthorized access, scraping at abusive volumes, interfering with the Service operation, or using it for any unlawful purpose.',
        },
        {
          title: 'Intellectual property',
          body: 'The Service, its code, and its original content are licensed under open-source terms. Plugin names, logos, and repository content belong to their respective owners. Data displayed is from public sources and remains subject to those sources\u2019 terms.',
        },
        {
          title: 'Limitation of liability',
          body: 'The Service is provided "as is" and "as available", without warranties of any kind, express or implied. To the maximum extent permitted by law, we are not liable for any damages arising from your use of the Service, including decisions made based on scores or flags shown here.',
        },
        {
          title: 'Third-party links',
          body: 'The Service may link to third-party websites (e.g., GitHub, npm). We are not responsible for the content or practices of those sites.',
        },
        {
          title: 'Changes to these terms',
          body: 'We may revise these Terms of Service at any time by updating this page. Continued use of the Service after changes constitutes acceptance of the revised terms.',
        },
        {
          title: 'Governing law',
          body: 'These terms are governed by the laws of the jurisdiction in which the Service operator is based, without regard to conflict-of-law principles.',
        },
        {
          title: 'Contact us',
          body: 'Questions about these Terms of Service? Contact us at ahmedlzany423@gmail.com.',
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about DSH Quality, our scores, and our security signals.',
      items: [
        {
          q: 'What is DSH Quality?',
          a: 'DSH Quality is an independent platform that scores DeepSeek Harness (DSH) plugins based on public GitHub and npm metadata, and surfaces security signals for risky install patterns. We measure, we do not recommend or install.',
        },
        {
          q: 'How is a plugin score computed?',
          a: 'Every plugin is scored across four weighted dimensions: Maintenance (28%), Docs (28%), npm (24%), and Ecosystem (20%). The score is a heuristic estimate recomputed on a regular schedule from public metadata.',
        },
        {
          q: 'What does a grade of A, B, C or D mean?',
          a: 'A (90–100) is excellent, B (75–89) is good, C (60–74) is fair, and D (<60) is poor. A plugin flagged for a dangerous install script can never exceed grade D.',
        },
        {
          q: 'What is a security flag?',
          a: 'A security flag is a heuristic warning based on detectable patterns: dangerous install scripts (e.g., curl|sh, base64 -d, powershell -enc), missing dsh.bundle declarations, and archived repositories. Flags are not proof of malicious intent.',
        },
        {
          q: 'Is a plugin safe if it has no flags?',
          a: 'Not necessarily. Heuristic detection cannot catch everything. Always inspect the install script and the code you run, and verify the plugin author before installing.',
        },
        {
          q: 'How often is the data updated?',
          a: 'Scores are recomputed on a weekly schedule and security flags are re-scanned on every refresh. New plugins are evaluated continuously as they appear in the ecosystem.',
        },
        {
          q: 'Can I get my plugin added or re-scored?',
          a: 'Plugins are discovered automatically from public sources. If a plugin is missing or the metadata looks wrong, contact us with the repository link and we will look into it.',
        },
        {
          q: 'Does paid placement affect scores?',
          a: 'No. Sponsored slots and promos are clearly labeled and completely separate from scoring, rankings, and security ratings. No paid placement ever influences a score.',
        },
        {
          q: 'How do I unsubscribe from the newsletter?',
          a: 'Every DSH Weekly email includes an unsubscribe link at the bottom. Click it and you will be removed from the list immediately.',
        },
        {
          q: 'How do I contact you?',
          a: 'Email us at ahmedlzany423@gmail.com. For feature requests or bug reports, you can also open an issue on our GitHub repository.',
        },
      ],
    },
    blog: {
      title: 'Blog',
      subtitle: 'Notes on the DSH plugin ecosystem: analysis, scoring deep dives, and security findings.',
      comingSoon: 'More articles are on the way — subscribe to DSH Weekly to stay in the loop.',
      posts: [
        {
          title: 'Welcome to DSH Quality',
          date: 'August 18, 2026',
          excerpt:
            'Why we built an independent quality score for the DeepSeek Harness plugin ecosystem — and why heuristic detection is only half the story.',
        },
        {
          title: 'Understanding the DSH plugin explosion',
          date: 'August 18, 2026',
          excerpt:
            'The ecosystem grew to over 4,300 plugins in days. We break down the numbers, the tag-baiting problem, and what it means for installers.',
        },
        {
          title: 'How install script scanning works',
          date: 'August 18, 2026',
          excerpt:
            'A look inside our dangerous-pattern scanner: what it checks, what it misses, and how to read the results responsibly.',
        },
      ],
    },
    contact: {
      title: 'Contact Us',
      subtitle:
        'Questions, feedback, or a plugin that needs a second look? We read everything sent to this address.',
      email: 'Email',
      emailAddress: 'ahmedlzany423@gmail.com',
      emailBody:
        'For the fastest response, write to ahmedlzany423@gmail.com. We typically reply within 2–3 business days.',
      github: 'GitHub',
      githubBody:
        'Found a bug or want to contribute? Open an issue or a pull request on the repository.',
      githubLink: 'Open the repository',
      response: 'What to include',
      responseBody:
        'For plugin-related questions, include the repository link and, if possible, the plugin name as shown on this site. For newsletter issues, include the email address you subscribed with.',
      privacyNote: 'We never share your email address or personal data with anyone.',
    },
  },
};

export default en;
