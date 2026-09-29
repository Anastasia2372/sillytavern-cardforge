export async function copyText(text) {
  if (window.cardForgeAPI?.copyText) {
    await window.cardForgeAPI.copyText(String(text));
  } else {
    await navigator.clipboard.writeText(String(text));
  }
}
