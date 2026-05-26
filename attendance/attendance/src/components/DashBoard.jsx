import { useState, useRef } from 'react';
import { 
    ShieldCheck,
  Activity,
  NotebookPen,
  LogOut, 
  ChevronRight, 
  Mail, 
  MapPin, 
  Briefcase, 
  X,
  Edit2,
  Phone,
  Camera
} from 'lucide-react';
import LogoImg from '../assets/logo.jpg';
import { api } from '../api';

const Dashboard = ({ onLogout, onSectionClick, userEmail, rep }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(rep?.profile_pic || null);
  const fileInputRef = useRef(null);
  const extractName = (email) => {
    if (!email) return "Staff Member";
    return email.split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\d+/g, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        console.log("Base64 result:", base64);
        setProfilePic(base64);
        console.log("Set profilePic state");
        if (isEditing) {
          setEditForm(prev => ({ ...prev, profilePic: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const defaultProfile = {
    name: rep?.full_name || extractName(userEmail),
    email: userEmail || rep?.email || 'user@example.com',
    phone: '+250 788 123 456',
    position: 'Class representative',
    department: rep?.class_name || 'SPE',
    joinDate: 'January 15, 2024',
    address: 'Kigali, Rwanda',
    profilePic: rep?.profile_pic || null
  };

  const [savedProfile, setSavedProfile] = useState(null);
  const profileData = savedProfile || defaultProfile;
  const [editForm, setEditForm] = useState(defaultProfile);
  
  const sections = [
    {
      id: "teachers",
      title: "Lesson Tracking",
      desc: "Mark your daily studying process based on the timetable.",
      icon: <Activity className="text-white" size={22} />,
    },
    {
      id: "students",
      title: "Students Attendance",
      desc: "Mark the attendance of students and keep track of their progress.",
      icon: <NotebookPen className="text-white" size={22} />,
    },
  ];

  console.log("Rendering Dashboard: profilePic =", profilePic, ", profileData.profilePic =", profileData.profilePic);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="sticky top-0 z-50 bg-[#2e5a88] text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
           <div className="bg-white rounded-2xl shadow-xl mb-2 inline-block p-2">
                       <img 
                         src={LogoImg} 
                         alt="StaffNet Logo" 
                         className="w-6 h-6 object-contain" 
                       />
                     </div>
          <span className="text-xl font-bold tracking-tight">StaffNet</span>
        </div>
        
        <div className="flex items-center gap-5">
          <button onClick={() => { setShowProfile(true); setProfilePic(profileData.profilePic); }} className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-xl transition-all">
            {profilePic || profileData.profilePic ? (
              <img 
                src={profilePic || profileData.profilePic} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover border border-white/20" 
              />
            ) : (
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center border border-white/20 font-bold text-[#2e5a88]">
                {profileData.name[0]}
              </div>
            )}
            <span className="hidden sm:inline font-semibold text-sm text-gray-200">{profileData.name.split(' ')[0]}</span>
          </button>
    
          <button 
            onClick={onLogout}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all" 
            title="Logout"
          >
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-5xl">
          <header className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 mb-6 inline-block p-5 border border-slate-50">
              <img src={LogoImg} alt="StaffNet Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-[#2e5a88] tracking-tight mb-3">StaffNet.</h1>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <ShieldCheck size={18} />
              <p className="font-bold uppercase tracking-[0.2em] text-xs">Attendance Tracking Portal</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {sections.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSectionClick(item.id)}
                className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_30px_60px_rgba(46,90,136,0.08)] hover:-translate-y-2 transition-all duration-500 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#2e5a88]/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                
                <div className="bg-[#2e5a88] w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-900/20 group-hover:rotate-6 group-hover:scale-110 transition-all">
                  {item.icon}
                </div>

                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-[#2e5a88] mb-3 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed mb-10 max-w-[280px]">
                    {item.desc}
                  </p>
                  
                  <div className="flex items-center text-[11px] font-black text-[#2e5a88] uppercase tracking-[0.2em] pt-6 border-t border-slate-50">
                    <span className="group-hover:mr-2 transition-all">Enter Section</span>
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#2e5a88] to-[#1e3f63] p-8 text-white flex justify-between items-center">
              <h2 className="text-3xl font-black">My Profile</h2>
              <button onClick={() => { setShowProfile(false); setIsEditing(false); setProfilePic(profileData.profilePic); }} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <div className="text-center mb-8">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  {profilePic || profileData.profilePic ? (
                    <img 
                      src={profilePic || profileData.profilePic} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover shadow-lg" 
                    />
                  ) : (
                    <div className="w-20 h-20 bg-[#2e5a88] rounded-full flex items-center justify-center text-white font-black text-3xl shadow-lg">
                      {profileData.name[0]}
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#2e5a88] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#1e3f63] transition-all"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <h3 className="text-2xl font-black text-[#001f3f]">{profileData.name}</h3>
                <p className="text-gray-500 font-semibold">{profileData.position}</p>
                {isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#2e5a88] text-sm font-semibold mt-2 hover:underline"
                  >
                    Change photo
                  </button>
                )}
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden"
              />

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <Mail size={18} className="text-[#2e5a88]" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                      <p className="font-semibold text-gray-700">{profileData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <Phone size={18} className="text-[#2e5a88]" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Phone</p>
                      <p className="font-semibold text-gray-700">{profileData.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <Briefcase size={18} className="text-[#2e5a88]" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Department</p>
                      <p className="font-semibold text-gray-700">{profileData.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <MapPin size={18} className="text-[#2e5a88]" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Address</p>
                      <p className="font-semibold text-gray-700">{profileData.address}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <p className="text-xs text-gray-400 font-semibold mb-3">JOINED</p>
                    <p className="text-gray-700 font-bold">{profileData.joinDate}</p>
                  </div>

                  <button 
                    onClick={() => { 
                      setIsEditing(true); 
                      setEditForm(profileData); 
                      setProfilePic(profileData.profilePic); 
                    }} 
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-[#2e5a88] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1e3f63] transition-all"
                  >
                    <Edit2 size={18} /> Edit Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5a88]"
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={editForm.email} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5a88]"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5a88]"
                  />
                  <input 
                    type="text" 
                    placeholder="Position" 
                    value={editForm.position} 
                    onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5a88]"
                  />
                  <input 
                    type="text" 
                    placeholder="Department" 
                    value={editForm.department} 
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5a88]"
                  />
                  <input 
                    type="text" 
                    placeholder="Address" 
                    value={editForm.address} 
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5a88]"
                  />

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => { setIsEditing(false); setEditForm(profileData); }} 
                      className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => { 
                        const newProfile = { ...editForm, profilePic: profilePic || editForm.profilePic };
                        console.log("Saving profile:", newProfile);
                        try {
                          await api.updateProfile({ 
                            full_name: newProfile.name, 
                            email: newProfile.email,
                            profilePic: newProfile.profilePic 
                          });
                          setSavedProfile(newProfile); 
                          setProfilePic(newProfile.profilePic);
                          setIsEditing(false); 
                        } catch (error) {
                          console.error("Failed to update profile:", error);
                          alert("Failed to update profile: " + (error.message || "Unknown error"));
                        }
                      }} 
                      className="flex-1 px-6 py-3 bg-[#2e5a88] text-white rounded-xl font-bold hover:bg-[#1e3f63] transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
