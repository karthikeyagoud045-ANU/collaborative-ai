import { supabase } from "./supabase-client";

// ROOM OPERATIONS

export async function getOrCreateRoom(roomCode: string) {
  // Try to find existing first
  const { data: existing } = await supabase
    .from("rooms")
    .select("*")
    .eq("room_code", roomCode)
    .single();

  if (existing) return existing;

  // Try to insert — if duplicate (race condition), fetch existing instead
  const { data: created, error } = await supabase
    .from("rooms")
    .upsert({ room_code: roomCode, name: "Room " + roomCode }, { onConflict: "room_code", ignoreDuplicates: true })
    .select()
    .single();

  if (error) {
    // If upsert failed for some other reason, try fetching again
    const { data: retry } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode)
      .single();
    if (retry) return retry;
    throw error;
  }

  return created;
}

export async function saveRoomFile(roomId: string, filePath: string, content: string, language: string = "plaintext") {
  const fileName = filePath.split("/").pop() || filePath;
  const { error } = await supabase
    .from("room_files")
    .upsert(
      { room_id: roomId, file_path: filePath, file_name: fileName, content, language },
      { onConflict: "room_id,file_path" }
    );
  return !error;
}

export async function getRoomFiles(roomId: string) {
  const { data, error } = await supabase
    .from("room_files")
    .select("*")
    .eq("room_id", roomId);
  return error ? [] : data || [];
}

// CHAT OPERATIONS

export async function saveChatMessage(roomId: string, userId: string, username: string, text: string, isSystem: boolean = false) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ room_id: roomId, user_id: userId, username, text, is_system: isSystem });
  return !error;
}

export async function getChatMessages(roomId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return error ? [] : data || [];
}

// AI MESSAGE OPERATIONS

export async function saveAIMessage(roomId: string, userId: string, role: string, content: string, model: string = "") {
  const { error } = await supabase
    .from("ai_messages")
    .insert({ room_id: roomId, user_id: userId, role, content, model });
  return !error;
}

export async function getAIMessages(roomId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return error ? [] : data || [];
}

// STORAGE OPERATIONS

export async function uploadSketch(roomId: string, file: File) {
  const path = roomId + "/" + Date.now() + "-" + file.name;
  const { error } = await supabase.storage
    .from("sketches")
    .upload(path, file, { upsert: true });
  if (error) return null;
  const { data: url } = supabase.storage.from("sketches").getPublicUrl(path);
  return url.publicUrl;
}

export async function uploadRoomFile(roomId: string, file: File) {
  const path = roomId + "/" + file.name;
  const { error } = await supabase.storage
    .from("room-files")
    .upload(path, file, { upsert: true });
  if (error) return null;
  const { data: url } = supabase.storage.from("room-files").getPublicUrl(path);
  return url.publicUrl;
}
