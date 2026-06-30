<template>
  <div class="flex h-dvh overflow-hidden bg-american-diamond">
    <AdminSidebar class="w-[250px] shrink-0" />

    <div class="flex flex-1 flex-col overflow-hidden">
      <AdminTopbar />
      <main class="flex-1 overflow-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>
