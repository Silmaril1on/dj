import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getServerUser,
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);
    if (error || !user) {
      console.log("Authentication failed:", error);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const supabase = await createSupabaseServerClient(cookieStore);

    const title = formData.get("title");
    const content = formData.get("content");
    const description = formData.get("description");
    const link = formData.get("link");
    const news_image = formData.get("news_image");


    // Validate required fields
    if (!title || !content || !description || !news_image) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, description, news_image" },
        { status: 400 }
      );
    }

    // Validate file type - ADD NULL CHECK
    if (!news_image.type || !news_image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file" },
        { status: 400 }
      );
    }

    // Generate unique filename - FIXED
    let fileExtension;
    try {
      fileExtension = news_image.name.split(".").pop();
      if (!fileExtension) {
        return NextResponse.json(
          { error: "Invalid file name" },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error("File name processing error:", err);
      return NextResponse.json(
        { error: "Invalid file" },
        { status: 400 }
      );
    }

    // Generate random filename instead of using title
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `news_${Date.now()}_${randomId}.${fileExtension}`;

    // Upload image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("news_images")
      .upload(fileName, news_image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }


    // Get public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("news_images").getPublicUrl(fileName);


    // Prepare news data with user_id
    const newsData = {
      title,
      content,
      description,
      news_image: publicUrl,
      link: link || null, // Handle empty link
      user_id: user.id,
    };


    // Insert news into database
    const { data: newNews, error: insertError } = await supabase
      .from("news")
      .insert([newsData])
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to create news: ${insertError.message}` },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: "News submitted successfully",
      data: newNews,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 15;
    const offset = (page - 1) * limit;

    const { data: news, error } = await supabaseAdmin
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total count for pagination info
    const { count } = await supabaseAdmin
      .from("news")
      .select("title, news_image", { count: "exact", head: true });

    const hasMore = offset + limit < count;

    return NextResponse.json({ 
      news, 
      pagination: {
        page,
        limit,
        total: count,
        hasMore
      }
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}