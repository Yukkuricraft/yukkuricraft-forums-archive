<template>
  <b-navbar id="top-navbar" toggleable="lg" type="dark" variant="primary">
    <b-container>
      <router-link v-slot="{ href, navigate }" :to="{ name: 'home' }" custom>
        <b-navbar-brand :href="href" @click="navigate">Yukkuricraft forums archive</b-navbar-brand>
      </router-link>
      <b-navbar-toggle target="navbarSupportedContent" />
      <b-collapse id="navbarSupportedContent" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-form>
            <b-form-input class="mr-sm-2" placeholder="Search..." />
            <b-button-group class="my-2 my-sm-0">
              <b-button>Search</b-button>
              <b-button>Advanced search</b-button>
            </b-button-group>
          </b-nav-form>
        </b-navbar-nav>
      </b-collapse>
    </b-container>
  </b-navbar>
</template>

<script>
import {
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BNavbarNav,
  BNavForm,
  BContainer,
  BCollapse,
  BFormInput,
  BButtonGroup,
  BButton,
} from 'bootstrap-vue'

export default {
  components: {
    BNavbar,
    BNavbarBrand,
    BNavbarToggle,
    BNavbarNav,
    BNavForm,
    BContainer,
    BCollapse,
    BFormInput,
    BButtonGroup,
    BButton,
  },
}
</script>
