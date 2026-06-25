"use client"
import React from "react";
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Zap } from 'lucide-react';

interface BurnoutGaugeProps {
  score?: number;
  riskLevel?: 'low' | 'moderate' | 'high';
}

export default function BurnoutGauge({ 
  score = 32,
  riskLevel = 'low'
}: BurnoutGaugeProps) {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'high':
        return {
          color: '#F97316',
          gradient: 'from-[#F97316] to-[#FB923C]',
          icon: AlertTriangle,
          label: 'High Risk',
          description: 'Consider taking a break and practicing self-care'
        };
      case 'moderate':
        return {
          color: '#FBBF24',
          gradient: 'from-[#FBBF24] to-[#FCD34D]',
          icon: Zap,
          label: 'Moderate',
          description: 'Your stress levels are manageable but monitor them'
        };
      default:
        return {
          color: '#4A90A4',
          gradient: 'from-[#6FA8C7] to-[#4A90A4]',
          icon: Shield,
          label: 'Low Risk',
          description: 'You\'re managing stress well. Keep it up!'
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;
  
  // Calculate arc path for semi-circular gauge
  const radius = 50;
  const circumference = Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      role="img" 
      aria-label={`Burnout risk: ${config.label}, score ${score}`}
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Gauge SVG */}
      <div className="relative w-32 h-20">
        <svg viewBox="0 0 120 70" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#EAF2F4"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="burnoutGradient" x1="0%" y1="0%" x2="100%">
              <stop offset="0%" stopColor="#6FA8C7" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          
          {/* Progress arc */}
          <motion.path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="url(#burnoutGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center -mt-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Icon className="w-6 h-6" style={{ color: config.color }} />
          </motion.div>
        </div>
      </div>

      {/* Labels */}
      <div className="text-center mt-2">
        <motion.div 
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white text-sm font-medium`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Icon className="w-4 h-4" />
          {config.label}
        </motion.div>
        
        <motion.p 
          className="mt-2 text-xs text-[#64748B] max-w-[180px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          {config.description}
        </motion.p>
      </div>
    </motion.div>
  );
}
