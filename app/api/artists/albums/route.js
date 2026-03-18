import { NextResponse } from "next/server";
import {
  createAlbum,
  deleteAlbum,
  getAlbums,
  updateAlbum,
} from "@/app/lib/services/artists/artistAlbums";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : null;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const result = await getAlbums(artistId, limit);

    if (result.error) {
      console.error("Error fetching artist albums:", result.error);
      return NextResponse.json(
        { error: "Failed to fetch albums" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.albums,
      hasMore: result.hasMore,
      total: result.total,
    });
  } catch (error) {
    console.error("Albums API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const artistId = formData.get("artistId");
    const name = formData.get("name");
    const releaseDate = formData.get("release_date");
    const description = formData.get("description");
    const tracklist = formData.get("tracklist");
    const albumImage = formData.get("album_image");

    if (!artistId || !name) {
      return NextResponse.json(
        { error: "Artist ID and album name are required" },
        { status: 400 },
      );
    }

    const result = await createAlbum({
      artistId,
      name,
      releaseDate,
      description,
      tracklist,
      albumImage,
    });

    if (result.invalidTracklist) {
      return NextResponse.json(
        { error: "Invalid tracklist format" },
        { status: 400 },
      );
    }

    if (result.uploadError) {
      return NextResponse.json(
        {
          error: "Failed to upload album image",
          details: result.uploadError.message,
        },
        { status: 500 },
      );
    }

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to add album", details: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Album added successfully",
      data: result.album,
    });
  } catch (error) {
    console.error("Create album API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    const artistId = formData.get("artistId");
    const albumId = formData.get("albumId") || formData.get("album_id");
    const name = formData.get("name");
    const releaseDate = formData.get("release_date");
    const description = formData.get("description");
    const tracklist = formData.get("tracklist");
    const albumImage = formData.get("album_image");

    if (!artistId || !albumId || !name) {
      return NextResponse.json(
        { error: "Artist ID, album ID, and album name are required" },
        { status: 400 },
      );
    }

    const result = await updateAlbum({
      artistId,
      albumId,
      name,
      releaseDate,
      description,
      tracklist,
      albumImage,
    });

    if (result.invalidTracklist) {
      return NextResponse.json(
        { error: "Invalid tracklist format" },
        { status: 400 },
      );
    }

    if (result.uploadError) {
      return NextResponse.json(
        {
          error: "Failed to upload album image",
          details: result.uploadError.message,
        },
        { status: 500 },
      );
    }

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to update album", details: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Album updated successfully",
      data: result.album,
    });
  } catch (error) {
    console.error("Update album API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { artistId, albumId } = await request.json();

    if (!artistId || !albumId) {
      return NextResponse.json(
        { error: "Artist ID and album ID are required" },
        { status: 400 },
      );
    }

    const result = await deleteAlbum({ artistId, albumId });

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to delete album", details: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Album deleted successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Delete album API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
