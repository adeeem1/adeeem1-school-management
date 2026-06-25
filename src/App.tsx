/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, Teacher, SavedPin, UserSession } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './initialData';
import { getSavedState, saveState, formatCurrency } from './utils';

import StudentList from './components/StudentList';
import TeacherList from './components/TeacherList';
import DashboardStats from './components/DashboardStats';
import StudentModal from './components/StudentModal';
import TeacherModal from './components/TeacherModal';
import PinLogin from './components/PinLogin';
import SecuritySettings from './components/SecuritySettings';

import { motion } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  BarChart3, 
  Calendar, 
  Wallet,
  Settings,
  HelpCircle,
  TrendingUp,
  School,
  LogOut,
  Fingerprint
} from 'lucide-react';

import {
  initFirebaseService,
  subscribeToStudents,
  subscribeToTeachers,
  subscribeToPins,
  dbSaveStudent,
  dbDeleteStudent,
  dbSaveTeacher,
  dbDeleteTeacher,
  dbSavePin,
  dbDeletePin,
  uploadLocalDataToFirebase
} from './services/firebase';

export default function App() {
  // State loaded dynamically from localStorage or initialData fallback
  const [students, setStudents] = useState<Student[]>(() => 
    getSavedState<Student[]>('nj_school_students', INITIAL_STUDENTS)
  );
  
  const [teachers, setTeachers] = useState<Teacher[]>(() => 
    getSavedState<Teacher[]>('nj_school_teachers', INITIAL_TEACHERS)
  );

  // Authorized PINs
  const [pins, setPins] = useState<SavedPin[]>(() => 
    getSavedState<SavedPin[]>('nj_school_pins', [])
  );

  // Active user session
  const [userSession, setUserSession] = useState<UserSession | null>(() => 
    getSavedState<UserSession | null>('nj_school_session', null)
  );

  // Firebase status
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  const [isMigrated, setIsMigrated] = useState(() => 
    getSavedState<boolean>('nj_school_migrated', false)
  );

  // Synchronize with LocalStorage on updates (fallback or offline storage)
  useEffect(() => {
    saveState('nj_school_students', students);
  }, [students]);

  useEffect(() => {
    saveState('nj_school_teachers', teachers);
  }, [teachers]);

  useEffect(() => {
    saveState('nj_school_pins', pins);
  }, [pins]);

  useEffect(() => {
    saveState('nj_school_session', userSession);
  }, [userSession]);

  // Initialize Firebase and set listeners
  useEffect(() => {
    initFirebaseService((active) => {
      setIsFirebaseActive(active);
    });
  }, []);

  // Listen for Cloud updates in real-time if Firebase is connected
  useEffect(() => {
    if (!isFirebaseActive) return;

    const unsubStudents = subscribeToStudents((list) => {
      if (list.length > 0) {
        setStudents(list);
      }
    });

    const unsubTeachers = subscribeToTeachers((list) => {
      if (list.length > 0) {
        setTeachers(list);
      }
    });

    const unsubPins = subscribeToPins((list) => {
      setPins(list);
    });

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubTeachers) unsubTeachers();
      if (unsubPins) unsubPins();
    };
  }, [isFirebaseActive]);

  // Sync / Migrate Local Data to Firebase once on activation
  useEffect(() => {
    if (isFirebaseActive && !isMigrated) {
      const runMigration = async () => {
        try {
          await uploadLocalDataToFirebase(students, teachers, pins);
          setIsMigrated(true);
          saveState('nj_school_migrated', true);
          console.log('Firebase migration completed.');
        } catch (error) {
          console.error('Error during automatic data migration:', error);
        }
      };
      runMigration();
    }
  }, [isFirebaseActive, isMigrated]);

  // Log in session handler
  const handleLoginSuccess = (pin: SavedPin) => {
    const session: UserSession = {
      pinId: pin.id,
      label: pin.label,
      role: pin.role,
      loginTime: new Date().toISOString()
    };
    setUserSession(session);
    displayAlert(`مرحباً بك ${pin.label}! تم تسجيل الدخول الآمن بنجاح.`);
  };

  const handleLogout = () => {
    if (window.confirm('🔒 هل تريد قفل لوحة التحكم وتسجيل الخروج؟')) {
      setUserSession(null);
      setActiveTab('students');
    }
  };

  // Current active navigation tab: 'students' | 'teachers' | 'stats' | 'security'
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'stats' | 'security'>('students');

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Toast / Status Alerts
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const displayAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4500);
  };

  // Student CRUD operations
  const handleSaveStudent = async (student: Student) => {
    if (isFirebaseActive) {
      await dbSaveStudent(student);
      displayAlert(`[سحابي] تم حفظ بيانات المتمدرس (${student.name}) بنجاح!`);
    } else {
      // Local Database Fallback
      if (editingStudent) {
        setStudents(prev => prev.map(s => s.id === student.id ? student : s));
        displayAlert(`تم تحديث بيانات التلميذ (${student.name}) والدفوعات بنجاح!`);
      } else {
        if (students.some(s => s.id === student.id)) {
          alert('رقم التسجيل هذا مستخدم بالفعل من قبل طالب آخر!');
          return;
        }
        setStudents(prev => [...prev, student]);
        displayAlert(`تم تسجيل التلميذ (${student.name}) وتوثيق الدفع بنجاح!`);
      }
    }
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    if (window.confirm(`⚠️ تنبيه إداري حاسم: هل أنت متأكد من رغبتك في حذف ملف الطالب (${student.name}) نهائياً؟`)) {
      if (isFirebaseActive) {
        await dbDeleteStudent(id);
        displayAlert(`[سحابي] تم إزالة التلميذ (${student.name}) بنجاح.`);
      } else {
        setStudents(prev => prev.filter(s => s.id !== id));
        displayAlert(`تم حذف ملف الطالب (${student.name}) بنجاح من السجلات المحلية.`);
      }
    }
  };

  // Teacher CRUD operations
  const handleSaveTeacher = async (teacher: Teacher) => {
    if (isFirebaseActive) {
      await dbSaveTeacher(teacher);
      displayAlert(`[سحابي] تم حفظ بيانات الأستاذ (${teacher.name}) بنجاح!`);
    } else {
      // Local Database Fallback
      if (editingTeacher) {
        setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
        displayAlert(`تم تحديث بيانات الأستاذ (${teacher.name}) والتعويضات الدورية بنجاح!`);
      } else {
        if (teachers.some(t => t.id === teacher.id)) {
          alert('معرف الأستاذ هذا مستخدم مسبقاً! يرجى اختيار رمز تعريف آخر.');
          return;
        }
        setTeachers(prev => [...prev, teacher]);
        displayAlert(`تم تسجيل الأستاذ (${teacher.name}) وتوطين شروط مستحقاته المادية بنجاح!`);
      }
    }
    setIsTeacherModalOpen(false);
    setEditingTeacher(null);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsTeacherModalOpen(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;

    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من شطب ملف الأستاذ (${teacher.name}) وإلغاء حصصه ومستحقاته المالية؟`)) {
      if (isFirebaseActive) {
        await dbDeleteTeacher(id);
        displayAlert(`[سحابي] تم حذف ملف الأستاذ (${teacher.name}) من السحابة.`);
      } else {
        setTeachers(prev => prev.filter(t => t.id !== id));
        displayAlert(`تم إزالة الأستاذ (${teacher.name}) من كشوف الطاقم بنجاح.`);
      }
    }
  };

  // PIN code management
  const handleAddPin = async (newPin: SavedPin) => {
    if (isFirebaseActive) {
      await dbSavePin(newPin);
    } else {
      setPins(prev => [...prev, newPin]);
    }
  };

  const handleDeletePin = async (id: string) => {
    if (isFirebaseActive) {
      await dbDeletePin(id);
    } else {
      setPins(prev => prev.filter(p => p.id !== id));
    }
  };

  // Header quick statistics counters
  const studentRevenues = students.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
  const formattedRevenues = formatCurrency(studentRevenues);

  // If there is no active logged-in user session, enforce PinLogin first!
  if (!userSession) {
    return (
      <PinLogin 
        onLoginSuccess={handleLoginSuccess}
        authorizedPins={pins}
        fallbackAdminPin="2026"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      
      {/* 1. Header Banner & Logo */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand Frame */}
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <img 
                src="https://scontent.faae1-1.fna.fbcdn.net/v/t1.15752-9/535575380_766411842414847_6734401257965136101_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=107&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeEOU6Ah_ShYNqWyg70a-m-XTWJeV1xOtJBNYl5XXE60kK9pzidq2nYoHNe59CTeMaC5ADUjKi1YMn1naQc-jyrG&_nc_ohc=gO4f5WugaHgQ7kNvwFiph8X&_nc_oc=AdqedIlBrImqdluOuzVWFBwqZjslramrgpQgMGi9ckmauOvKGnb77CYSquMpiWDg6Pg&_nc_ad=z-m&_nc_cid=1060&_nc_zt=23&_nc_ht=scontent.faae1-1.fna&_nc_ss=7a22e&oh=03_Q7cD5gEsD3mzaaLaVZ7Q8adtjvWhFo_jJqvdXOexiwnPJMy3hA&oe=6A456A68"
                alt="شعار مدرسة النجاح"
                className="h-10 w-auto rounded-lg object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="space-y-0.5 justify-start text-right">
              <div className="flex items-center gap-1.5 justify-start">
                <School className="w-5 h-5 text-blue-700" />
                <h1 className="text-md sm:text-lg font-extrabold text-blue-900 tracking-tight">مدرسة النجاح الخاصة للتعليم والدعم</h1>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                لوحة التحكم والتنظيم المالي والإداري • إدارة المتعهدين والطلاب والأساتذة
              </p>
            </div>
          </div>

          {/* Quick Realtime header counters */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>مداخيل المدرسة النشطة: {formattedRevenues}</span>
            </div>
            
            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 font-sans">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>الموسم الدراسي: 2025/2026</span>
            </div>

            {/* Logout Lock control */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900 rounded-xl text-[11px] font-bold border border-red-100/50 transition-colors cursor-pointer"
              title="قفل لوحة التحكم وتسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>قفل الخروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Container with Tab Buttons navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* Active user status bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/45 px-5 py-2.5 rounded-2xl border border-blue-100/40 text-[11px] font-bold text-blue-950 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">👤</span>
            <span>المستخدم الحالي: <span className="underline">{userSession.label}</span> ({userSession.role === 'admin' ? 'مدير عام كامل الصلاحيات' : 'موظف مأذون له'})</span>
          </div>
          {isFirebaseActive ? (
            <div className="text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>موصول بالشبكة السحابية المشتركة (الهاتف والكمبيوتر متطابقان فورياً)</span>
            </div>
          ) : (
            <div className="text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span>قاعدة بيانات محلية نشطة (سيتم المزامنة تلقائياً عند الاتصال)</span>
            </div>
          )}
        </div>

        {/* Alerts / Banner Notifications */}
        {alertMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-blue-950 text-white rounded-2xl border border-blue-900 shadow-lg text-xs font-bold flex items-center gap-2"
          >
            <span className="text-base">🔔</span>
            <span>{alertMessage}</span>
          </motion.div>
        )}

        {/* Tab Buttons Shelf */}
        <div className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'students' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            id="tab-students"
          >
            <Users className="w-4 h-4" />
            قائمة التلاميذ والمسجلين ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'teachers' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            id="tab-teachers"
          >
            <GraduationCap className="w-4 h-4" />
            قائمة الأساتذة والمستحقات ({teachers.length})
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'stats' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            id="tab-stats"
          >
            <BarChart3 className="w-4 h-4" />
            الإحصائيات المالية والتقارير الشهرية
          </button>

          {/* Secure Admin configuration */}
          {userSession.role === 'admin' && (
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-100/10'
              }`}
              id="tab-security"
            >
              <Fingerprint className="w-4 h-4" />
              إعدادات الأمان والتراخيص ({pins.length + 1})
            </button>
          )}

        </div>

        {/* 3. Panel Views rendering */}
        <div className="transition-all duration-300">
          {activeTab === 'students' && (
            <StudentList
              students={students}
              onAddClick={() => {
                setEditingStudent(null);
                setIsStudentModalOpen(true);
              }}
              onEditClick={handleEditStudent}
              onDeleteClick={handleDeleteStudent}
            />
          )}

          {activeTab === 'teachers' && (
            <TeacherList
              teachers={teachers}
              students={students}
              onAddClick={() => {
                setEditingTeacher(null);
                setIsTeacherModalOpen(true);
              }}
              onEditClick={handleEditTeacher}
              onDeleteClick={handleDeleteTeacher}
            />
          )}

          {activeTab === 'stats' && (
            <DashboardStats
              students={students}
              teachers={teachers}
            />
          )}

          {activeTab === 'security' && userSession.role === 'admin' && (
            <SecuritySettings
              pins={pins}
              onAddPin={handleAddPin}
              onDeletePin={handleDeletePin}
              isFirebaseSynced={isFirebaseActive}
              currentUserPin={pins.find(p => p.id === userSession.pinId) || {
                id: 'default_admin',
                pin: '2026',
                label: 'المدير العام',
                role: 'admin',
                createdAt: ''
              }}
            />
          )}
        </div>

      </main>

      {/* 4. Modular Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        editingStudent={editingStudent}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacher(null);
        }}
        onSave={handleSaveTeacher}
        editingTeacher={editingTeacher}
      />

      {/* Footer Branding info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400 mt-12 space-y-1 py-4 border-t border-gray-150">
        <p>© 2026 مدرسة النجاح الخاصة. جميع الحقوق محفوظة.</p>
        <p className="font-mono">نظام مشفر ومؤمن سحابياً لحفظ وتدقيق رواتب المعلمين والمعاملات الدراسية تلقائياً.</p>
      </footer>

    </div>
  );
}
