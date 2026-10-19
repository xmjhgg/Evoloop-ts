/** Expo File.move changes the object's URI. Cleanup must never delete that promoted destination. */
export async function promoteFile(
  stage: { readonly exists: boolean; delete(): void },
  write: () => Promise<void>,
  promote: () => void,
) {
  let promoted = false;
  try {
    await write();
    promote();
    promoted = true;
  } finally {
    if (!promoted && stage.exists) stage.delete();
  }
}
