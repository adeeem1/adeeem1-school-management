/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SavedPin } from '../types';
import { Shield, KeyRound, ArrowRight, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface PinLoginProps {
  onLoginSuccess: (pin: SavedPin) => void;
  authorizedPins: SavedPin[];
  fallbackAdminPin: string;
}

export default function PinLogin({ onLoginSuccess, authorizedPins, fallbackAdminPin }: PinLoginProps) {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Pad numbers click handlers for mobile-friendly keypad
  const handleNumberClick = (num: string) => {
    setErrorMsg(null);
    if (pinInput.length < 6) {
      setPinInput(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (pinInput.length < 4) {
      setErrorMsg('يجب أن يتكون رمز المرور من 4 أرقام على الأقل.');
      return;
    }

    // 1. Check against authorized pins
    let matchedPin = authorizedPins.find(p => p.pin === pinInput);

    // 2. Fallback check for initial setup
    if (!matchedPin && pinInput === fallbackAdminPin) {
      matchedPin = {
        id: 'default_admin',
        pin: fallbackAdminPin,
        label: 'المدير العام (رمز افتراضي)',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
    }

    if (matchedPin) {
      // Secure login animation triggers
      onLoginSuccess(matchedPin);
    } else {
      setErrorMsg('رمز المرور الذي أدخلته غير صحيح. يرجى التواصل مع المدير لتخويل دخولك.');
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-4" dir="rtl">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-white/20"
      >
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center">
            <img 
              src="https://scontent.faae1-1.fna.fbcdn.net/v/t1.15752-9/535575380_766411842414847_6734401257965136101_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=107&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeEOU6Ah_ShYNqWyg70a-m-XTWJeV1xOtJBNYl5XXE60kK9pzidq2nYoHNe59CTeMaC5ADUjKi1YMn1naQc-jyrG&_nc_ohc=gO4f5WugaHgQ7kNvwFiph8X&_nc_oc=AdqedIlBrImqdluOuzVWFBwqZjslramrgpQgMGi9ckmauOvKGnb77CYSquMpiWDg6Pg&_nc_ad=z-m&_nc_cid=1060&_nc_zt=23&_nc_ht=scontent.faae1-1.fna&_nc_ss=7a22e&oh=03_Q7cD5gEsD3mzaaLaVZ7Q8adtjvWhFo_jJqvdXOexiwnPJMy3hA&oe=6A456A68"
              alt="مدرسة النجاح"
              className="w-12 h-12 rounded-xl object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-blue-950">بوابة الدخول الآمنة</h2>
            <p className="text-xs text-gray-500 font-medium">مدرسة النجاح الخاصة للتعليم والدعم</p>
          </div>
        </div>

        {/* Input PIN Display */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-gray-700 block pr-1">إدخال رمز المرور الشخصي (PIN):</label>
            <div className="relative flex items-center">
              <KeyRound className="absolute right-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPin ? "text" : "password"}
                pattern="[0-9]*"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => {
                  setErrorMsg(null);
                  setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="••••••"
                className="w-full text-center tracking-widest text-lg font-bold pr-12 pl-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all text-blue-950 placeholder-gray-300"
                id="pin-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3.5 p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2 text-xs text-red-700 font-bold"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Verification Actions */}
          <button
            type="submit"
            disabled={pinInput.length < 4}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 active:scale-98 transition-all"
            id="pin-submit-btn"
          >
            <Shield className="w-4 h-4" />
            <span>تسجيل الدخول الآمن</span>
          </button>
        </form>

        {/* Visual Numeric Keypad - Absolute game changer for screen accessibility on active phones */}
        <div className="pt-2">
          <p className="text-[10px] text-center text-gray-400 font-medium mb-3">لوحة مفاتيح الأرقام السريعة للهاتف المحمول</p>
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num)}
                className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl font-extrabold text-gray-800 hover:text-blue-800 transition-colors active:scale-95 duration-100 cursor-pointer text-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl font-bold text-red-700 text-xs cursor-pointer"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl font-extrabold text-gray-800 hover:text-blue-800 cursor-pointer text-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 bg-amber-50 hover:bg-amber-100 border border-amber-150 rounded-xl font-bold text-amber-700 text-xs cursor-pointer"
            >
              حذف
            </button>
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-gray-400 font-medium">
            مؤمن بتشفير متبادل ومربوط تلقائياً بسحابة مدرسة النجاح لمزامنة بيانات الهاتف والكمبيوتر.
          </p>
        </div>

      </motion.div>
    </div>
  );
}
