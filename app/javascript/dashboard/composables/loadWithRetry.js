import { ref } from 'vue';

export const useLoadWithRetry = (config = {}) => {
  const maxRetry = config.max_retry || 3;
  const backoff = config.backoff || 1000;
  const mediaType = config.mediaType || 'image';

  const isLoaded = ref(false);
  const hasError = ref(false);
  const loadedUrl = ref('');

  const loadWithRetry = async url => {
    const attemptLoad = () => {
      return new Promise((resolve, reject) => {
        const cacheBustedUrl = new URL(url, window.location.origin);
        cacheBustedUrl.searchParams.set('t', Date.now());

        const onSuccess = () => {
          isLoaded.value = true;
          hasError.value = false;
          loadedUrl.value = cacheBustedUrl.toString();
          resolve();
        };

        const element = mediaType === 'audio' ? new Audio() : new Image();
        if (mediaType === 'audio') {
          element.preload = 'metadata';
          element.onloadedmetadata = onSuccess;
        } else {
          element.onload = onSuccess;
        }

        element.onerror = () => reject(new Error('Failed to load resource'));
        element.src = cacheBustedUrl.toString();
      });
    };

    const sleep = ms => {
      return new Promise(resolve => {
        setTimeout(resolve, ms);
      });
    };

    const retry = async (attempt = 0) => {
      try {
        await attemptLoad();
      } catch (error) {
        if (attempt + 1 >= maxRetry) {
          hasError.value = true;
          isLoaded.value = false;
          return;
        }
        await sleep(backoff * (attempt + 1));
        await retry(attempt + 1);
      }
    };

    await retry();
  };

  return {
    isLoaded,
    hasError,
    loadedUrl,
    loadWithRetry,
  };
};
