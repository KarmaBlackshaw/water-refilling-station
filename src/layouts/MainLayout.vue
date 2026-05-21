<template>
  <div class="flex h-dvh overflow-hidden bg-american-diamond">
    <TheSidebar class="w-[250px] shrink-0" />

    <div class="flex flex-1 flex-col overflow-hidden">
      <TheTopbar />
      <main class="flex-1 overflow-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>
