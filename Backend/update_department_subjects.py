# update_department_subjects.py - Run this script to update departments

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from digital_library.models import Department
from digital_library.subjects_data import DEPARTMENT_SUBJECTS

def update_department_subjects():
    print("=" * 60)
    print("📚 UPDATING DEPARTMENT SEARCH SUBJECTS")
    print("=" * 60)
    
    updated = 0
    skipped = 0
    
    for code, subjects in DEPARTMENT_SUBJECTS.items():
        dept = Department.objects.filter(code=code).first()
        if dept:
            dept.search_subjects = subjects
            dept.save()
            updated += 1
            print(f"✅ Updated: {dept.name}")
            print(f"   Subjects: {subjects[:80]}...")
        else:
            skipped += 1
            print(f"⚠️ Department not found: {code}")
    
    print("\n" + "=" * 60)
    print(f"📊 SUMMARY:")
    print(f"   ✅ Updated: {updated} departments")
    print(f"   ⚠️ Skipped: {skipped} (not found)")
    
    total_depts = Department.objects.count()
    print(f"   📚 Total departments in DB: {total_depts}")
    print("=" * 60)
    
    # Show any departments that might need manual update
    if updated < total_depts:
        print("\n⚠️ Departments without subjects (need manual update):")
        updated_codes = set(DEPARTMENT_SUBJECTS.keys())
        for dept in Department.objects.all():
            if dept.code not in updated_codes:
                print(f"   - {dept.name} (code: {dept.code})")

if __name__ == "__main__":
    update_department_subjects()