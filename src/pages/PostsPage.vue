<template>
  <div>
    <h1 v-if="getCurrentTopic">{{ getCurrentTopic.title }}</h1>

    <b-card v-for="(post, idx) in getPosts" :key="'post-' + post.content" class="mb-1">
      <b-media no-body>
        <b-media-aside style="max-width: 128px">
          <div class="text-center">
            <b-img
              rounded
              width="128"
              blank-color="#ccc"
              src="https://forums.yukkuricraft.net/core/image.php?userid=353&dateline=1494369663"
            />
            <p><strong>Katrix</strong></p>
            <p>Shulker box confiscator</p>
            <p>
              Join Date: Apr 2013
              <br />
              Posts: 3493
            </p>
          </div>
        </b-media-aside>

        <b-media-body>
          <div class="d-flex flex-row justify-content-between">
            <small>05-05-2017, 01:34 AM</small>
            <a href="#">#{{ idx + 1 }}</a>
          </div>

          <div class="forum-post-content">
            <span style="font-size: 48px">RTY 3 Beta</span><br />
            <br />
            So, now after so much time of waiting, the beta for RTY 3 is finally open. Unlike last time, this is an open
            beta, and represents how the pack will be downloaded once it's actually released. Do please remember that
            this is a beta, lot's of stuff isn't done yet (server configs, game configs, touhou content), and the map
            might be wiped during the beta. The map WILL also be wiped at the end of the beta. So, how do you access it?
            It's still a bit complicated at this point, but easier than installing a beta has ever been. Either you can
            go here
            <a
href="https://minecraft.curseforge.com/projects/release-the-yukkuri" target="_blank"
              >https://minecraft.curseforge.com/pro...se-the-yukkuri</a
            >
            and download and install the pack manually, or you can find the modpack in the Curse/Twitch launcher.
            Instructions for that here
            <a
              href="https://www.curseforge.com/knowledge-base/minecraft/2755-installing-a-modpack-from-twitch-app"
              target="_blank"
              >https://www.curseforge.com/knowledge...rom-twitch-app</a
            >.<br />
            <br />
            Once you are in you need to enter the server. There isn't a button for that yet, so you need to type in the
            address yourself. The server address is
            <code
              style="
                font-family: monospace;
                border-radius: 3px;
                background-color: rgba(27, 31, 35, 0.1);
                padding: 0;
                padding-top: 0.2em;
                padding-bottom: 0.2em;
                font-size: 95%;
              "
              >rty.katsstuff.net</code
            >.<br />
            <br />
            <span style="font-size: 28px">Advice and FAQ</span><br />
            <br />
            <span style="font-size: 20px">Keeping full hunger is so hard with SpiceOfLife</span><br />
            Try to find different types of food. Grown food is the best type in the early game. In addition to that,
            look for a village. They usually has multipple types of food. In addition to that, look for other more
            interesting types of food like melons, pumpkin pie, cookies, and so on.<br />
            <br />
            <span style="font-size: 20px">The enemies are so hard early game because of low health</span><br />
            First of, remember that running is always an option. If you can, avoid the enemy. Also, make sure to always
            be aware of your surroundings. In addition to that, try to look for lifeblood hears. They should spawn in
            dungeon chests (both overworld and nether, although maybe a bit more in the nether). You will also receive a
            lifeblood heart once you have gone through the rules (once that's in place).<br />
            <br />
            <span style="font-size: 28px">Changelog</span><br />
            <br />
            <span style="font-size: 20px">0.2</span><br />
            Fixed crash when killing danmaku mobs<br />
            Lifeblood crystals now spawn in the overworld<br />
            Made all config stuff lowercase so that it will work on linux as well<br />
            Nights are now a bit lighter on average
          </div>
        </b-media-body>
      </b-media>
    </b-card>

    <b-pagination-nav
      v-if="getCurrentTopic"
      class="mt-3"
      align="center"
      :link-gen="pageLinkGen"
      :number-of-pages="Math.ceil(getCurrentTopic.responses / 10)"
      :limit="7"
      use-router
    ></b-pagination-nav>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import { BCard, BMedia, BMediaAside, BMediaBody, BImg, BPaginationNav } from 'bootstrap-vue'

export default {
  components: {
    BCard,
    BMedia,
    BMediaAside,
    BMediaBody,
    BImg,
    BPaginationNav,
  },
  props: {
    forumPathP: {
      type: [Array, String],
      required: true,
    },
  },
  computed: {
    ...mapGetters('topics', ['getCurrentTopic']),
    ...mapGetters('posts', ['getPosts']),
    page() {
      let maybePage

      if (Array.isArray(this.forumPathP)) {
        maybePage = this.forumPathP[this.forumPathP.length - 1]
      } else {
        const last = this.forumPathP.lastIndexOf('/')
        maybePage = this.forumPathP.slice(last + 1)
      }

      if (this.isPagePart(maybePage)) {
        return parseInt(maybePage)
      } else {
        return 1
      }
    },
    forumPath() {
      if (Array.isArray(this.forumPathP)) {
        if (this.isPagePart(this.forumPathP[this.forumPathP.length - 1])) {
          return this.forumPathP.slice(0, -1)
        }

        return this.forumPathP
      }

      const parts = this.forumPathP.split('/')

      if (this.isPagePart(parts[parts.length - 1])) {
        parts.pop()
      }

      return parts
    },
  },
  watch: {
    forumPath: {
      immediate: true,
      async handler(newVal) {
        await this.loadPosts({ topicPath: newVal, page: this.page })
      },
    },
    async page(newVal) {
      await this.loadPosts({ topicPath: this.forumPath, page: newVal })
    },
  },
  async created() {
    await this.loadCurrentTopic({ topicPath: this.forumPath })
  },
  methods: {
    ...mapActions('topics', ['loadCurrentTopic']),
    ...mapActions('posts', ['loadPosts']),
    pageLinkGen(newPage) {
      return {
        name: 'posts',
        params: {
          forumPathP: newPage === 1 ? this.forumPath : [...this.forumPath, `${newPage}page`],
        },
      }
    },
    isPagePart(part) {
      return /\d+page/gm.test(part)
    },
  },
}
</script>
