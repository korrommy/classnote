// ClassNote — Database types (เขียนมือให้ตรงกับ schema 0001-0003)
// ภายหลังจะ regenerate ด้วย `supabase gen types typescript` ได้

export type MemberRole = "student" | "class_admin";
export type NoteVisibility = "classroom" | "public" | "both";
export type AssignmentProgress = "pending" | "completed";
export type NoteFileType = "pdf" | "doc" | "image" | "link";

export type Profile = {
  id: string;
  full_name: string | null;
  student_no: string | null;
  grade_level: string | null;
  classroom_id: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
}

export type Classroom = {
  id: string;
  name: string;
  grade_level: string | null;
  room: string;
  created_by: string | null;
  created_at: string;
}

export type ClassroomMember = {
  id: string;
  classroom_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export type StudentRoster = {
  id: string;
  classroom_id: string;
  student_no: string;
  full_name: string;
  claimed_by: string | null;
  created_at: string;
}

export type Subject = {
  id: string;
  classroom_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export type Note = {
  id: string;
  classroom_id: string | null;
  subject_id: string | null;
  author_id: string;
  title: string;
  content: string | null;
  visibility: NoteVisibility;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type NoteFile = {
  id: string;
  note_id: string;
  file_url: string;
  file_type: NoteFileType;
  file_name: string | null;
  created_at: string;
}

export type Assignment = {
  id: string;
  classroom_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export type AssignmentStatus = {
  id: string;
  assignment_id: string;
  user_id: string;
  status: AssignmentProgress;
  completed_at: string | null;
}

export type Announcement = {
  id: string;
  classroom_id: string;
  title: string;
  content: string | null;
  created_by: string | null;
  created_at: string;
}

export type FlashcardDeck = {
  id: string;
  classroom_id: string | null;
  grade_level: string | null;
  title: string;
  created_by: string | null;
  created_at: string;
}

export type Flashcard = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  sort_order: number;
  created_at: string;
}

export type FlashcardProgress = {
  id: string;
  deck_id: string;
  user_id: string;
  completed_count: number;
  completed_card_ids: string[];
  rounds: number;
  updated_at: string;
}

export type NoteLike = {
  note_id: string;
  user_id: string;
  created_at: string;
}

export type SavedNote = {
  id: string;
  note_id: string;
  user_id: string;
  created_at: string;
}

export type Comment = {
  id: string;
  note_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

// ---- Database wrapper สำหรับ Supabase client generic ----
// Relationships ใส่เฉพาะ FK ที่โค้ดใช้ hint แบบ `!fkey_name` เท่านั้น
type TableDef<Row, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      classrooms: TableDef<Classroom>;
      classroom_members: TableDef<
        ClassroomMember,
        [
          {
            foreignKeyName: "classroom_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      student_roster: TableDef<StudentRoster>;
      subjects: TableDef<Subject>;
      notes: TableDef<Note>;
      note_files: TableDef<NoteFile>;
      assignments: TableDef<Assignment>;
      assignment_status: TableDef<AssignmentStatus>;
      announcements: TableDef<Announcement>;
      flashcard_decks: TableDef<FlashcardDeck>;
      flashcards: TableDef<Flashcard>;
      flashcard_progress: TableDef<FlashcardProgress>;
      note_likes: TableDef<NoteLike>;
      saved_notes: TableDef<SavedNote>;
      comments: TableDef<Comment>;
    };
    Views: Record<string, never>;
    Functions: {
      claim_roster: {
        Args: { p_classroom_id: string; p_student_no: string };
        Returns: Profile;
      };
      is_member_of: { Args: { p_classroom_id: string }; Returns: boolean };
      can_access_note: { Args: { p_note_id: string }; Returns: boolean };
      is_class_admin: { Args: { p_classroom_id: string }; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      member_role: MemberRole;
      note_visibility: NoteVisibility;
      assignment_progress: AssignmentProgress;
      note_file_type: NoteFileType;
    };
    CompositeTypes: Record<string, never>;
  };
}
