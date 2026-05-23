<script setup lang="ts">
const appConfig = useAppConfig()

const services = [
  {
    title: 'Order and Booking Management',
    description: 'Handle customer orders, service reservations, payment flow, and booking confirmation in one system.'
  },
  {
    title: 'Product and Post Control',
    description: 'Publish products, manage stock, update pricing, and organize promotional posts from a single dashboard.'
  },
  {
    title: 'Guest Link Pages',
    description: 'Generate customer-friendly links for direct ordering or booking without requiring a full account login.'
  }
]

const capabilities = [
  'Create service posts and product campaigns',
  'Control product availability and booking schedule',
  'Generate guest pages for customer orders and reservations',
  'Track order status from request to completion'
]

const metrics = [
  { label: 'Core Service', value: 'Orders + Bookings' },
  { label: 'Admin Flow', value: 'Post and Product Control' },
  { label: 'Customer Access', value: 'Guest Link Pages' }
]
</script>

<template>
  <section class="min-h-screen  text-slate-950 transition-colors">
    <div class="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div class="space-y-8">
          <div class="space-y-5">
            <span
              class="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-1 text-sm font-medium tracking-wide text-orange-700 dark:text-orange-200"
            >
              Company Profile
            </span>

            <h1 class="max-w-5xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl dark:text-white">
              Digital service platform for orders, bookings, and product control
            </h1>

            <p class="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              We provide a business platform that helps companies publish services and products,
              receive customer orders or bookings, and manage operations from a single control panel.
              Customers can also use guest links for direct order or booking access.
            </p>
          </div>

          <div class="flex flex-wrap gap-4">
            <el-button type="primary" size="large" round>
              Request Demo
            </el-button>
            <NuxtLink to="/dashboard">
              <el-button size="large" plain round>
                View Dashboard
              </el-button>
            </NuxtLink>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div
              v-for="item in metrics"
              :key="item.label"
              class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur"
            >
              <p class="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">
                {{ item.label }}
              </p>
              <p class="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                {{ item.value }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 dark:backdrop-blur">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">
                Business Solution
              </p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                What the platform supports
              </h2>
            </div>
            <div
              class="h-12 w-12 rounded-2xl"
              :style="{ backgroundColor: appConfig.theme.primary }"
            />
          </div>

          <div class="space-y-4">
            <article
              v-for="service in services"
              :key="service.title"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/70"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-lg font-semibold text-slate-950 dark:text-white">
                    {{ service.title }}
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {{ service.description }}
                  </p>
                </div>
                <span
                  class="mt-1 inline-flex h-3 w-3 shrink-0 rounded-full"
                  :style="{ backgroundColor: appConfig.theme.primary }"
                />
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <p class="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400">
            Main Capabilities
          </p>
          <ul class="mt-5 space-y-3">
            <li
              v-for="item in capabilities"
              :key="item"
              class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <span
                class="mt-2 inline-flex h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: appConfig.theme.primary }"
              />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <div class="rounded-[2rem] border border-orange-400/20 bg-gradient-to-br from-orange-100 to-white p-6 dark:from-orange-500/10 dark:to-white/5">
          <p class="text-sm uppercase tracking-[0.22em] text-orange-700 dark:text-orange-200">
            Customer Flow
          </p>
          <div class="mt-5 grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-950/50">
              <p class="text-sm font-semibold text-slate-950 dark:text-white">1. Publish</p>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Admin posts products or services with price, images, schedule, and details.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-950/50">
              <p class="text-sm font-semibold text-slate-950 dark:text-white">2. Share</p>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Generate a guest page link for customers to submit an order or booking request.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-950/50">
              <p class="text-sm font-semibold text-slate-950 dark:text-white">3. Control</p>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Track order status, confirm bookings, and control product availability from the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
