<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="blob blob-a bg-turquoise-stone" />
    <div class="blob blob-b bg-psychedelic-aqua" />
    <div class="blob blob-c bg-bondi-blue" />
    <div class="blob blob-d bg-cerulean" />
  </div>
</template>

<style scoped>
.blob {
  position: absolute;
  filter: blur(60px);
  will-change: transform, border-radius;
}

.blob-a {
  top: -120px;
  left: -100px;
  width: 420px;
  height: 420px;
  opacity: 0.55;
  animation: drift-a 14s ease-in-out infinite;
}

.blob-b {
  bottom: -80px;
  right: -90px;
  width: 360px;
  height: 360px;
  opacity: 0.55;
  animation: drift-b 18s ease-in-out infinite;
}

.blob-c {
  top: 40%;
  right: 18%;
  width: 280px;
  height: 280px;
  opacity: 0.35;
  animation: drift-c 22s ease-in-out infinite;
}

.blob-d {
  bottom: 12%;
  left: 10%;
  width: 220px;
  height: 220px;
  opacity: 0.4;
  animation: drift-a 20s ease-in-out infinite reverse;
}

@keyframes drift-a {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
  }
  33% {
    transform: translate(30px, -40px) scale(1.08);
    border-radius: 50% 60% 40% 55% / 45% 55% 50% 60%;
  }
  66% {
    transform: translate(-25px, 25px) scale(0.95);
    border-radius: 55% 45% 65% 35% / 60% 40% 55% 45%;
  }
}

@keyframes drift-b {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
  }
  50% {
    transform: translate(-35px, 30px) scale(1.1);
    border-radius: 60% 40% 55% 45% / 40% 60% 45% 55%;
  }
}

@keyframes drift-c {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    border-radius: 50% 50% 60% 40% / 60% 50% 50% 40%;
  }
  40% {
    transform: translate(25px, 35px) scale(1.05);
    border-radius: 55% 45% 50% 50% / 50% 60% 40% 50%;
  }
  80% {
    transform: translate(-30px, -20px) scale(0.92);
    border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
  }
}
</style>
