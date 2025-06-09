import { defineStore } from 'pinia'
import { computed, type Ref, ref, shallowRef, watch } from 'vue'
import type { User } from '@yukkuricraft-forums-archive/types/user'
import { watchArray } from '@vueuse/core'
import { doFetch } from '@/stores/utils.ts'

interface UserFetch {
  promise: Ref<Promise<User | null>>
  user: Ref<User | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  requestedAt: Ref<number>
}

export const useUsersStore = defineStore('users', () => {
  const users = shallowRef<Record<number, UserFetch>>({})

  async function fetchUsers(userIds: number[]) {
    const usersToLookup = userIds.filter((v) => !users.value[v])

    if (usersToLookup.length === 0) {
      return await Promise.all(userIds.map((id) => users.value[id].promise))
    }

    const promise = doFetch<User[]>('/api/users', 'users', undefined, {
      userId: userIds,
    })

    const userFetches = usersToLookup.map((id) => {
      const userFetch: UserFetch = {
        promise: ref(promise.then((res) => res.find((u) => u.id === id) ?? null)),
        user: ref(null),
        error: ref(null),
        isLoading: ref(true),
        requestedAt: ref(new Date().getTime()),
      }
      users.value[id] = userFetch

      return [id, userFetch] as const
    })
    const userFetchRecord = Object.fromEntries(userFetches)

    try {
      const users = await promise
      users.forEach((user) => {
        userFetchRecord[user.id].user.value = user
        userFetchRecord[user.id].isLoading.value = false
      })
      return users
    } catch (e) {
      userFetches.map(([, userFetch]) => {
        userFetch.error.value = e as Error
        userFetch.isLoading.value = false
      })
      throw e
    }
  }

  function watchUserArray(userIds: Ref<number[]>) {
    watchArray(userIds, (v, old, added) => {
      fetchUsers(added).catch((e) => {
        console.error(e)
      })
    })
  }

  function useUser(userId: Ref<number | undefined | null>) {
    watch(
      userId,
      (v) => {
        if (v !== undefined && v !== null) {
          fetchUsers([v]).catch((e) => {
            console.error(e)
          })
        }
      },
      { immediate: true },
    )
    return computed(() => {
      if (userId.value === undefined || userId.value === null) {
        return null
      }
      return users.value[userId.value]?.user?.value ?? null
    })
  }

  return { users, fetchUsers, watchUserArray, useUser }
})
