/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Teacher } from './types';

/**
 * Dynamically computes a teacher's monthly salary / dues based on current students and payment rules
 */
export function calculateTeacherCompensation(teacher: Teacher, students: Student[]): number {
  if (teacher.compensationType === 'fixed') {
    return teacher.compensationValue;
  } else if (teacher.compensationType === 'hourly') {
    return teacher.compensationValue * teacher.hoursWorked;
  } else if (teacher.compensationType === 'percentage') {
    // Sum total fees of active students enrolled in this teacher's subject
    const subjectStudents = students.filter(
      s => s.subject.trim() === teacher.subject.trim() && s.status === 'active'
    );
    const totalFees = subjectStudents.reduce((sum, s) => sum + s.amount, 0);
    return Math.round(totalFees * (teacher.compensationValue / 100));
  }
  return 0;
}

/**
 * Extracts initials of an Arabic or English name for avatar placement
 */
export function getInitials(name: string): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return 'ن';
  return parts.map(part => part[0]).join('');
}

/**
 * Format currency to beautiful Arabic readable format
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

/**
 * Save data securely to LocalStorage helper
 */
export function getSavedState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading State from LocalStorage:', error);
  }
  return defaultValue;
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving State to LocalStorage:', error);
  }
}
