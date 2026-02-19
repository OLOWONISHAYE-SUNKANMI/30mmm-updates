"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Settings() {
  const { authState } = useAuth();
  const [firstTabActive, setFirstTabActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [showUploads, setShowUploads] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    maritalStatus: "",
    childrenCount: "",
    churchAffiliation: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (authState.isAuthenticated && authState.user?.id) {
        try {
          const response = await fetch(`/api/create-profile`);
          if (response.ok) {
            const data = await response.json();
            console.log('Profile data received:', data);
            if (data.profile) {
              // Use image from API response or fallback to authState
              const userImage = data.user?.image || authState.user?.image;
              if (userImage && typeof userImage === 'string') {
                console.log('Setting image preview to:', userImage);
                setImagePreview(userImage);
              }
              setFormData({
                firstName: data.profile.firstName || "",
                lastName: data.profile.lastName || "",
                birthDate: data.profile.birthDate
                  ? new Date(data.profile.birthDate).toISOString().split("T")[0]
                  : "",
                maritalStatus: data.profile.maritalStatus || "",
                childrenCount: data.profile.childrenCount?.toString() || "",
                churchAffiliation: data.profile.churchAffiliation || "",
                email: data.profile.email || authState.user.email || "",
                phoneNumber: data.profile.phoneNumber || "",
                address: data.profile.address || "",
                city: data.profile.city || "",
                state: data.profile.state || "",
                zipcode: data.profile.zipcode || "",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error?.message || error);
        } finally {
          setLoading(false);
        }
      }
    };

    // Set image from authState immediately if available
    if (authState.user?.image && !imagePreview) {
      setImagePreview(authState.user.image);
    }

    fetchProfile();
    
    // fetch user's videos
    const fetchVideos = async () => {
      if (authState.isAuthenticated && authState.user?.id) {
        setVideosLoading(true);
        try {
          const res = await fetch(`/api/videos?userId=${authState.user.id}`);
          if (res.ok) {
            const data = await res.json();
            
            if (!Array.isArray(data)) {
              console.error('Videos data is not an array:', data && data.message ? data.message : data);
              setVideos([]);
              return;
            }
            
            setVideos(data);
          } else {
            console.error('Failed to fetch videos:', res.status, res.statusText);
            setVideos([]);
          }
        } catch (error) {
          console.error("Error fetching videos:", error?.message || error);
          setVideos([]);
        } finally {
          setVideosLoading(false);
        }
      }
    };

    fetchVideos();
  }, [authState.isAuthenticated, authState.user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("profileData", JSON.stringify(formData));
      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      }

      const response = await fetch(`/api/create-profile`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        // Use the SAS URL if provided, otherwise use the raw URL
        if (result.imageUrl) {
          setImagePreview(result.imageUrl);
          setProfileImage(null); // Clear the file input after successful upload
        }
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error?.message || error);
      alert("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return (
      authState.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "AD"
    );
  };

  if (authState.loading || loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-red border-t-transparent animate-spin"></div>
          </div>
          <p className="text-descriptions-grey text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col items-center justify-start gap-2 2xs:gap-3 px-2 2xs:px-4">
        <h1 className="mt-16 2xs:mt-18 xs:mt-20 text-center text-2xl 2xs:text-3xl xs:text-4xl font-semibold">
          Edit Profile
        </h1>
        <div className="relative">
          {imagePreview && typeof imagePreview === 'string' && imagePreview.trim() !== '' ? (
            <img
              src={imagePreview}
              alt="Profile"
              className="size-32 xs:size-36 sm:size-40 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                console.error('Image failed to load');
                setImagePreview(null);
              }}
              onLoad={() => console.log('Image loaded successfully')}
            />
          ) : (
            <div className="grid size-32 xs:size-36 sm:size-40 items-center justify-center rounded-full bg-rose-600 border-4 border-white shadow-lg">
              <span className="text-5xl xs:text-6xl sm:text-7xl font-extrabold tracking-wider text-white">
                {getInitials()}
              </span>
            </div>
          )}
        </div>
        <label className="text-sm 2xs:text-base font-semibold tracking-tight text-primary-red hover:scale-95 cursor-pointer">
          Upload Picture
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
        <div className="flex min-h-[200px] w-full max-w-4xl flex-col items-center px-2 2xs:px-4">
          <div className="items-stetch my-2 inline-flex min-h-max flex-row justify-between gap-x-1 2xs:gap-x-2 xs:gap-x-3 overflow-y-hidden rounded-2xl 2xs:rounded-3xl bg-gray-bg p-0.5 text-center">
            <button
              onClick={() => setFirstTabActive(true)}
              className={`h-full w-full text-nowrap rounded-2xl 2xs:rounded-3xl px-1 2xs:px-2 py-1.5 2xs:py-2 text-[10px] 2xs:text-xs font-light hover:bg-almost-black hover:font-medium hover:text-white active:bg-almost-black active:font-medium active:text-white ${firstTabActive ? "bg-almost-black font-medium text-white" : ""}`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setFirstTabActive(false)}
              className={`h-full w-full text-nowrap rounded-2xl 2xs:rounded-3xl px-1 2xs:px-2 py-1.5 2xs:py-2 text-[10px] 2xs:text-xs font-light hover:bg-almost-black hover:font-medium hover:text-white active:bg-almost-black active:font-medium active:text-white ${firstTabActive ? "" : "bg-almost-black font-medium text-white"}`}
            >
              Address
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="text-sm 2xs:text-base my-2 2xs:my-3 grid h-min w-full flex-auto grid-cols-1 content-baseline items-center gap-y-1.5 2xs:gap-y-2 font-normal sm:grid-cols-2"
          >
            {!!firstTabActive && (
              <>
                <label
                  htmlFor="firstName"
                  className="block px-2 2xs:px-4 xs:px-6 sm:px-8"
                >
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl 2xs:rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0 text-sm 2xs:text-base py-2 2xs:py-3"
                    placeholder="First Name"
                  />
                </label>
                <label
                  htmlFor="lastName"
                  className="block px-2 2xs:px-4 xs:px-6 sm:px-8"
                >
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-xl 2xs:rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0 text-sm 2xs:text-base py-2 2xs:py-3"
                    placeholder="Last Name"
                  />
                </label>
                <label
                  htmlFor="birthDate"
                  className="block px-2 2xs:px-4 xs:px-6 sm:px-8"
                >
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-xl 2xs:rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0 text-sm 2xs:text-base py-2 2xs:py-3"
                    placeholder="12-25-1979"
                  />
                </label>
                <label
                  htmlFor="maritalStatus"
                  className="block px-2 2xs:px-4 xs:px-6 sm:px-8"
                >
                  <input
                    type="text"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-xl 2xs:rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0 text-sm 2xs:text-base py-2 2xs:py-3"
                    placeholder="Marital Status"
                  />
                </label>
                <label
                  htmlFor="childrenCount"
                  className="block px-2 2xs:px-4 xs:px-6 sm:px-8"
                >
                  <input
                    type="number"
                    name="childrenCount"
                    value={formData.childrenCount}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-xl 2xs:rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0 text-sm 2xs:text-base py-2 2xs:py-3"
                    placeholder="Number of Children"
                  />
                </label>
                <label
                  htmlFor="churchAffiliation"
                  className="block px-8"
                >
                  <input
                    type="text"
                    name="churchAffiliation"
                    value={formData.churchAffiliation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="Church Affiliation"
                  />
                </label>
              </>
            )}
            {/* Second Tab */}
            {!firstTabActive && (
              <>
                <label
                  htmlFor="email"
                  className="block px-8"
                >
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="Email"
                  />
                </label>
                <label
                  htmlFor="phoneNumber"
                  className="block px-8"
                >
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="Phone Number"
                  />
                </label>
                <label
                  htmlFor="address"
                  className="block px-8"
                >
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="Street Address"
                  />
                </label>
                <label
                  htmlFor="city"
                  className="block px-8"
                >
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="City"
                  />
                </label>
                <label
                  htmlFor="state"
                  className="block px-8"
                >
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="State"
                  />
                </label>
                <label
                  htmlFor="zipcode"
                  className="block px-8"
                >
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-transparent bg-formfield focus:border-white focus:bg-teal-50 focus:ring-0"
                    placeholder="Zip Code"
                  />
                </label>
              </>
            )}
          </form>
          
          <div className="items-stetch my-2 inline-flex min-h-max w-full flex-row gap-x-2 2xs:gap-x-3 rounded-2xl 2xs:rounded-3xl px-2 2xs:px-4 xs:px-6 sm:px-8 max-sm:order-2 max-sm:flex-col max-sm:gap-1.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="peer-hover:saturate[0.1] peer w-full rounded-xl 2xs:rounded-2xl border-2 border-primary-red py-2 2xs:py-3 text-sm 2xs:text-base text-primary-red transition-all hover:scale-[.98] hover:bg-primary-red hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="peer w-full rounded-xl 2xs:rounded-2xl bg-primary-red py-2 2xs:py-3 text-sm 2xs:text-base text-white transition-all hover:scale-[.98] hover:border-2 hover:border-primary-red hover:bg-white hover:text-primary-red disabled:opacity-50 peer-hover:saturate-[0.1]"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Toggle for Display Videos on Profile */}
          <div className="w-full max-w-4xl mt-6 px-2 2xs:px-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <div className="font-semibold text-sm 2xs:text-base">Display Videos on Profile</div>
                  <div className="text-xs text-gray-500">Your videos are visible to others</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploads(!showUploads)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showUploads ? 'bg-primary-red' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showUploads ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* User uploads */}
          {showUploads && (
            <div className="w-full max-w-4xl mt-6 px-2 2xs:px-4">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <h2 className="text-lg 2xs:text-xl font-semibold">My Videos</h2>
                <span className="text-sm text-gray-500">({videos.length})</span>
              </div>
              {videosLoading ? (
                <p>Loading uploads...</p>
              ) : videos.length === 0 ? (
                <p className="text-sm text-gray-500">You haven't uploaded any videos yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((v) => (
                    <div key={v.id} className="rounded-lg overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                      {v.blobUrl && (
                        <video 
                          className="w-full aspect-video object-cover bg-gray-100" 
                          controls
                          preload="metadata"
                          playsInline
                          onError={(e) => {
                            console.error(`Video load error for: ${v.fileName}`);
                          }}
                        >
                          <source src={v.blobUrl} type={v.fileType || "video/mp4"} />
                          <source src={v.blobUrl} type="video/webm" />
                          <source src={v.blobUrl} type="video/ogg" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {!v.blobUrl && (
                        <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                          <p className="text-sm text-gray-500">Video unavailable</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const response = await fetch(`/api/videos/${v.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isPublic: !v.isPublic })
                              });
                              if (response.ok) {
                                setVideos(prev => prev.map(video => 
                                  video.id === v.id ? { ...video, isPublic: !v.isPublic } : video
                                ));
                              }
                            } catch (error) {
                              console.error('Error toggling visibility:', error);
                            }
                          }}
                          className="p-2 bg-white/90 rounded-full hover:bg-white shadow-md transition-all"
                        >
                          {v.isPublic !== false ? (
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this video?')) {
                              try {
                                const response = await fetch(`/api/videos/${v.id}`, { method: 'DELETE' });
                                if (response.ok) {
                                  setVideos(prev => prev.filter(video => video.id !== v.id));
                                }
                              } catch (error) {
                                console.error('Error deleting video:', error);
                              }
                            }
                          }}
                          className="p-2 bg-white/90 rounded-full hover:bg-red-50 shadow-md transition-all"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm truncate mb-1">{v.fileName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
