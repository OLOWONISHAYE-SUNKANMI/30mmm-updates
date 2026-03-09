"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, MessageCircle, Eye, EyeOff, Trash2 } from "lucide-react";

export default function Settings() {
  const { authState } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [reflections, setReflections] = useState([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(true);
  const [selectedReflection, setSelectedReflection] = useState(null);
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
            if (data.profile) {
              const userImage = data.user?.image || authState.user?.image;
              if (userImage && typeof userImage === 'string') {
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

    if (authState.user?.image && !imagePreview) {
      setImagePreview(authState.user.image);
    }

    fetchProfile();
    
    const fetchVideos = async () => {
      if (authState.isAuthenticated && authState.user?.id) {
        setVideosLoading(true);
        try {
          const res = await fetch(`/api/videos?userId=${authState.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setVideos(data);
          }
        } catch (error) {
          console.error("Error fetching videos:", error);
        } finally {
          setVideosLoading(false);
        }
      }
    };

    const fetchReflections = async () => {
      if (authState.isAuthenticated && authState.user?.id) {
        setReflectionsLoading(true);
        try {
          const res = await fetch(`/api/reflections?userId=${authState.user.id}&all=true`); 
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setReflections(data);
          }
        } catch (error) {
          console.error("Error fetching reflections:", error);
        } finally {
          setReflectionsLoading(false);
        }
      }
    };

    fetchVideos();
    fetchReflections();
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
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error?.message || error);
      toast.error("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (item) => {
    try {
      const newVisibility = !item.isPublic;
      const endpoint = item.type === 'video' ? `/api/videos/${item.id}` : `/api/reflections/${item.id}`;
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newVisibility }),
      });

      if (response.ok) {
        // Update local state
        const updateState = (prev) => prev.map(i => i.id === item.id ? { ...i, isPublic: newVisibility } : i);
        if (item.type === 'video') setVideos(updateState);
        else setReflections(updateState);
        toast.success(`Post is now ${newVisibility ? 'public' : 'private'}`);
      } else {
        toast.error("Failed to update visibility");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

    try {
      const endpoint = item.type === 'video' ? `/api/videos/${item.id}` : `/api/reflections/${item.id}`;
      const response = await fetch(endpoint, { method: "DELETE" });

      if (response.ok) {
        // Update local state
        const filterState = (prev) => prev.filter(i => i.id !== item.id);
        if (item.type === 'video') setVideos(filterState);
        else setReflections(filterState);
        toast.success("Post deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete post");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
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

  const [firstTabActive, setFirstTabActive] = useState(true);

  if (authState.loading || loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#8B2A28] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const allSubmissions = [...videos.map(v => ({ ...v, type: 'video' })), ...reflections.map(r => ({ ...r, type: 'text' }))].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="mx-auto min-h-screen w-full max-w-[935px] flex flex-col pt-16 sm:pt-20 px-4 mb-20">
      {/* Instagram Header */}
      <div className="flex flex-row items-center mb-10 gap-8 sm:gap-12 pl-4 sm:pl-10">
        <div className="flex-shrink-0 relative">
          {imagePreview && typeof imagePreview === 'string' && imagePreview.trim() !== '' ? (
            <img
              src={imagePreview}
              alt="Profile"
              className="w-20 h-20 sm:w-36 sm:h-36 rounded-full object-cover border border-gray-200 shadow-sm"
            />
          ) : (
            <div className="flex w-20 h-20 sm:w-36 sm:h-36 items-center justify-center rounded-full bg-[#8B2A28] border border-gray-200 shadow-sm">
              <span className="text-2xl sm:text-5xl font-extrabold text-white">
                {getInitials()}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-light text-gray-800">
              {formData.firstName} {formData.lastName}
            </h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              {isEditing ? "View Profile" : "Edit Profile"}
            </button>
          </div>

          <div className="flex gap-6 sm:gap-10 mb-4 text-sm sm:text-base">
            <div><span className="font-semibold">{allSubmissions.length}</span> posts</div>
          </div>

          <div className="text-sm">
            <p className="font-semibold">{formData.firstName} {formData.lastName}</p>
            <p className="text-gray-600">{formData.churchAffiliation || "Member of 30MMM Program"}</p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col items-center w-full">
          <label className="text-sm font-semibold text-[#8B2A28] cursor-pointer mb-6 hover:underline">
            Change Profile Photo
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          
          <div className="flex my-4 rounded-3xl bg-gray-100 p-1">
            <button onClick={() => setFirstTabActive(true)} className={`px-6 py-2 rounded-2xl text-xs transition-all ${firstTabActive ? "bg-white shadow-sm font-semibold" : "text-gray-500"}`}>Personal Information</button>
            <button onClick={() => setFirstTabActive(false)} className={`px-6 py-2 rounded-2xl text-xs transition-all ${!firstTabActive ? "bg-white shadow-sm font-semibold" : "text-gray-500"}`}>Address</button>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {firstTabActive ? (
              <>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="First Name" />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Last Name" />
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" />
                <input type="text" name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Marital Status" />
                <input type="number" name="childrenCount" value={formData.childrenCount} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Number of Children" />
                <input type="text" name="churchAffiliation" value={formData.churchAffiliation} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Church Affiliation" />
              </>
            ) : (
              <>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Email" />
                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Phone Number" />
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Street Address" />
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="City" />
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="State" />
                <input type="text" name="zipcode" value={formData.zipcode} onChange={handleInputChange} className="p-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-[#8B2A28] focus:ring-1 focus:ring-[#8B2A28] transition-all" placeholder="Zip Code" />
              </>
            )}
            <div className="sm:col-span-2 flex gap-4 mt-6">
              <button disabled={loading} type="submit" className="flex-grow py-3 bg-[#8B2A28] text-white rounded-xl font-semibold hover:bg-[#AF3634] transition-all disabled:opacity-50">{loading ? "Saving..." : "Save Changes"}</button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex justify-center border-t border-gray-200 uppercase tracking-widest text-xs font-semibold">
            <button onClick={() => setActiveTab("posts")} className={`flex items-center gap-2 py-4 mr-12 transition-all border-t -mt-[1px] ${activeTab === "posts" ? "border-black text-black" : "border-transparent text-gray-400"}`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M21,3H3A2,2,0,0,0,1,5V19a2,2,0,0,0,2,2H21a2,2,0,0,0,2-2V5A2,2,0,0,0,21,3ZM21,19H3V5H21ZM7,7h4v4H7Zm6,0h4v4H13ZM7,13h4v4H7Zm6,0h4v4H13Z"/></svg>
              Posts
            </button>
            <button onClick={() => setActiveTab("reels")} className={`flex items-center gap-2 py-4 transition-all border-t -mt-[1px] ${activeTab === "reels" ? "border-black text-black" : "border-transparent text-gray-400"}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Reels
            </button>
          </div>

          {/* Post Grid */}
          {(activeTab === "posts" || activeTab === "reels") && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-2">
              {(activeTab === "posts" 
                ? allSubmissions.filter(i => i.type === 'text') 
                : allSubmissions.filter(i => i.type === 'video')
              ).map((item) => (
                <div 
                  key={`${item.type}-${item.id}`} 
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                  onClick={() => item.type === 'text' ? setSelectedReflection(item) : null}
                >
                  {/* Content Area */}
                  <div className="w-full h-full relative">
                    {item.type === 'video' ? (
                      <>
                        <video className="w-full h-full object-cover" muted src={item.blobUrl} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        
                        {/* Persistent Info Overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white drop-shadow-md">
                          <span className="text-[10px] sm:text-xs font-bold truncate pr-2">
                            {item.firstName} {item.lastName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px]">
                            <Heart className="w-2.5 h-2.5 fill-white" /> {item.likesCount || 0}
                          </div>
                        </div>

                        {/* Top Right Icons */}
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between bg-gray-50 border border-gray-100 relative">
                        {/* Top Section: Badge */}
                        <div className="flex justify-start">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-500 shadow-sm">
                            Day {item.day} • Week {item.week}
                          </span>
                        </div>

                        {/* Middle Section: Quote Content */}
                        <div className="flex-grow flex items-center justify-center py-2 px-2 sm:px-4">
                          <p className="text-gray-700 font-medium leading-relaxed line-clamp-4 text-xs sm:text-sm italic">
                            "{item.response}"
                          </p>
                        </div>
                        
                        {/* Bottom Section: Signature & Stats */}
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-200/50">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 font-bold">
                              {formData.firstName?.[0]}{formData.lastName?.[0]}
                            </div>
                            <span className="text-[10px] font-medium text-gray-400 truncate max-w-[80px]">
                              {formData.firstName} {formData.lastName}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-gray-300">
                             <Heart className="w-3 h-3 fill-gray-100" />
                             <span className="text-[10px] font-bold">{item.likesCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Persistent Admin Controls Barrier */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(item); }}
                            className={`p-1.5 rounded-lg shadow-lg backdrop-blur-md transition-all ${
                              item.isPublic 
                                ? 'bg-white/90 text-gray-700 hover:bg-white' 
                                : 'bg-red-500/90 text-white hover:bg-red-500'
                            }`}
                          >
                            {item.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.isPublic ? "Visible (Public)" : "Hidden (Private)"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                            className="p-1.5 bg-white/90 text-gray-700 hover:bg-red-50 rounded-lg shadow-lg backdrop-blur-md hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Delete Permanent</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
              {((activeTab === "posts" && !allSubmissions.some(i => i.type === 'text')) || 
                (activeTab === "reels" && !allSubmissions.some(i => i.type === 'video'))) && (
                <div className="col-span-full py-24 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <h3 className="text-gray-900 font-bold">No {activeTab} yet</h3>
                  <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest text-[10px]">Your journey is just beginning</p>
                </div>
              )}
            </div>
          )}

          {activeTab !== "posts" && activeTab !== "reels" && (
            <div className="py-20 text-center text-gray-400">
              <p className="text-xl font-light">Nothing to see here yet</p>
            </div>
          )}
        </>
      )}

      {/* Full Text Response Modal */}
      {selectedReflection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setSelectedReflection(null)}>
          <div className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-xl transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Text Submission (Week {selectedReflection.week} Day {selectedReflection.day})
              </h2>
              <button
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setSelectedReflection(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                {selectedReflection.response}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button 
                onClick={() => setSelectedReflection(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
