<script setup>
import { onMounted } from 'vue';
import { useBabyStore } from '@/stores/baby.js';

import HeroSection from '@/components/sections/HeroSection.vue';
import BabyProfile from '@/components/sections/BabyProfile.vue';
import BirthInfo from '@/components/sections/BirthInfo.vue';
import AgeCounterSection from '@/components/sections/AgeCounterSection.vue';
import StorySection from '@/components/sections/StorySection.vue';
import DoctorSection from '@/components/sections/DoctorSection.vue';
import TimelineSection from '@/components/sections/TimelineSection.vue';
import GallerySection from '@/components/sections/GallerySection.vue';
import StatsSection from '@/components/sections/StatsSection.vue';
import WishesSection from '@/components/sections/WishesSection.vue';
// import GiftSection from '@/components/sections/GiftSection.vue';   // dinonaktifkan
// import LocationSection from '@/components/sections/LocationSection.vue'; // dinonaktifkan
// import ShareBar from '@/components/sections/ShareBar.vue';         // dinonaktifkan
import AppFooter from '@/components/layout/AppFooter.vue';

const baby = useBabyStore();
onMounted(() => baby.fetch());
</script>

<template>
  <div>
    <HeroSection />
    <BabyProfile />
    <BirthInfo />
    <AgeCounterSection />
    <StorySection />
    <TimelineSection />
    <GallerySection />
    <!-- <GiftSection /> -->
    <DoctorSection />
    <!-- <LocationSection /> -->
    <StatsSection />
    <WishesSection />
    <!-- <ShareBar /> -->
    <AppFooter />
  </div>
</template>