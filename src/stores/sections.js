import waiterLoader from './waiterLoader'

const ycSections = [
  {
    title: 'Minecraft',
    slug: 'minecraft',
    forums: [
      {
        title: 'Administation',
        slug: 'administation',
        description: 'Admin-y stuff.',
        topicsCount: 46,
        postsCount: 199,
      },
      {
        title: 'Announcements',
        slug: 'announcements',
        description: 'Check back here every so often for important announcements about the server.',
        topicsCount: 173,
        postsCount: 2244,
      },
      {
        title: 'Community Events',
        slug: 'community-events',
        description: 'Where we discuss and schedule community events and the like!',
        topicsCount: 75,
        postsCount: 1293,
      },
      {
        title: 'Release The Yukkuri (RTY)',
        slug: 'release-the-yukkuri-rty',
        description: 'A section dedicated to RTY and its related content!',
        topicsCount: 33,
        postsCount: 1155,
        subforums: [
          {
            title: 'RTY Archive',
            slug: 'rty-archive',
            description: 'All posts that server only for previous versions of RTY',
            topicsCount: 26,
            postsCount: 1155,
          },
        ],
      },
      {
        title: 'Staff Section',
        slug: 'staff-section',
        description: 'For all staff members of Yukkuricraft!',
        topicsCount: 717,
        postsCount: 4219,
        subforums: [
          {
            title: 'Ban Reports',
            slug: 'ban-reports',
            description:
              "Report any server bans here. Forum bans don't require a report as there are logs already and are easier to view the reason for.",
            topicsCount: 360,
            postsCount: 1278,
          },
          {
            title: 'Permission Requests',
            slug: 'permission-requests',
            description: 'Worldedit? Voxelsniper? Read the policies and post your applications!',
            topicsCount: 6,
            postsCount: 109,
          },
          {
            title: 'Staff commands and tutorials',
            slug: 'staff-command-info',
            description:
              'Unsure about how to perform some staff action. This is probably the best place to check first.',
            topicsCount: 5,
            postsCount: 29,
          },
        ],
      },
      {
        title: 'Server/Forum Information',
        slug: 'server-forum-information',
        description: "This is where I'll post threads concerning how the server and forums works and the like.",
        topicsCount: 25,
        postsCount: 387,
      },
      {
        title: 'Locations in Gensokyo',
        slug: 'locations-in-gensokyo',
        description: 'Everyone keep information on individual build projects and the statuses of each build.',
        topicsCount: 150,
        postsCount: 736,
        subforums: [
          {
            title: 'Building events',
            slug: 'building-events',
            description: 'Info about various building and Gensokyo events go here.',
            topicsCount: 75,
            postsCount: 81,
          },
          {
            title: 'Legacy Threads',
            slug: 'legacy-threads',
            description: 'Simply for archiving purposes.',
            topicsCount: 56,
            postsCount: 655,
          },
        ],
      },
      {
        title: 'Server/Forum Suggestions/Bug Reports',
        slug: 'server-forum-suggestions-bug-reports',
        description:
          'Have any suggestions or requests for plugins? Ask here! Notice something with the server? Post that here too!',
        topicsCount: 223,
        postsCount: 1597,
        subforums: [
          {
            title: 'Quest Ideas',
            slug: 'quest-ideas',
            description:
              'Have an idea for a quest? Post it here! Gensokyo Quests will be implemented in 1.5 at latest!',
            topicsCount: 19,
            postsCount: 97,
          },
        ],
      },
      {
        title: 'Miscellaneous',
        slug: 'miscellaneous',
        description: 'For everything else.',
        topicsCount: 307,
        postsCount: 3048,
      },
      {
        title: 'Ban Appeals',
        slug: 'ban-appeals',
        description: 'Been banned? Want to explain? Maybe it was a miscommunication? Whatever the case, post it here!',
        topicsCount: 145,
        postsCount: 732,
      },
    ],
  },
  {
    title: 'Touhou Corner',
    slug: 'touhou-corner',
    forums: [
      {
        title: 'Official Game Discussion',
        slug: 'official-game-discussion',
        description:
          'Want to talk about one of the official games? Have information on Hopeless Masquerade? Post here!',
        topicsCount: 29,
        postsCount: 424,
      },
      {
        title: 'Touhou Media Share',
        slug: 'touhou-media-share',
        description:
          'Have a song, video, picture, or something else touhou media related that you want to share? Right here!',
        topicsCount: 141,
        postsCount: 1187,
      },
    ],
  },
  {
    title: 'Everything Else',
    slug: 'everything-else',
    forums: [
      {
        title: 'General Chitchat',
        slug: 'general-chitchat',
        description: 'For everything else there is to talk about.',
        topicsCount: 204,
        postsCount: 2620,
      },
      {
        title: 'Literature',
        slug: 'literature',
        description:
          'Do you write stories? Fanfics or otherwise? Want to share with the community? Do that right here!',
        topicsCount: 40,
        postsCount: 894,
      },
      {
        title: 'Non-Touhou Media Share',
        slug: 'non-touhou-media-share',
        description: 'For all your non-touhou related media needs and links!',
        topicsCount: 74,
        postsCount: 1400,
      },
      {
        title: 'Other Games',
        slug: 'other-games',
        description:
          "Well, we are gamers! I'm sure everyone plays games other than Touhou and Minecraft! Talk about it here!",
        topicsCount: 145,
        postsCount: 2448,
      },
      {
        title: 'RP Section',
        slug: 'rp-section',
        description:
          'Our RP section! Remember that ero-rp is still not allowed in this section. This is for whatever pg13 appropriate rp you may want to do. Current moderators are Tewi, Katrix and S121',
        topicsCount: 132,
        postsCount: 47785,
        subforums: [
          {
            title: 'Archive',
            slug: 'archive',
            topicsCount: 75,
            postsCount: 47785,
          },
        ],
      },
      {
        title: 'YCVN',
        slug: 'ycvn',
        description: 'Discussion for the Yukkuricraft Visual Novel Project!',
        topicsCount: 2,
        postsCount: 205,
      },
      {
        title: 'Introductions',
        slug: 'introductions',
        description: 'Post introductions here!',
        topicsCount: 224,
        postsCount: 2103,
      },
      {
        title: 'Spambox',
        slug: 'spambox',
        description: 'For all the nonsense games and whatnot.',
        topicsCount: 365,
        postsCount: 8824,
      },
    ],
  },
]

export default {
  namespaced: true,
  modules: {
    loader: waiterLoader('sections')(
      () => [],
      (data) => data.length,
      () => new Promise((resolve) => resolve(ycSections))
    ),
  },
  getters: {
    getSections(state) {
      return state.loader.data
    },
  },
  actions: {
    async loadSections({ dispatch }) {
      return await dispatch('loader/loadData')
    },
  },
}
