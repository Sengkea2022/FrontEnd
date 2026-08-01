<template>
  <!-- Full screen container -->
  <div class="flex h-screen">
    <SideMenu />
    <!-- Main content area: navbar → page content → footer -->
    <div class="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
      <Navbar />
      <main class="flex-1">
        <slot />
      </main>
      <AppFooter />
    </div>
  </div>
</template>