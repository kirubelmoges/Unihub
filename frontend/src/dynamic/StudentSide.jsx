import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../static/context';
import axiosInstance from '../static/csrf';
import { Link } from 'react-router-dom';
import { BriefcaseIcon, ClockIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon, UserIcon, AcademicCapIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function StudentSide() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    cover_letter: '',
    resume: null,
    essay: null,
    additional_documents: null,
    applicant_email: '',
    applicant_phone: '',
    applicant_education: '',
    applicant_experience: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        axiosInstance.get('/jobs/'),
        axiosInstance.get('/applications/my-applications/')
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setFormData({
      ...formData,
      applicant_email: user?.email || '',
      applicant_phone: user?.profile?.id_no || '',
      applicant_education: '',
      applicant_experience: ''
    });
    setShowApplyModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('job', selectedJob.id);
    submitData.append('cover_letter', formData.cover_letter);
    submitData.append('resume', formData.resume);
    submitData.append('applicant_email', formData.applicant_email);
    submitData.append('applicant_phone', formData.applicant_phone);
    submitData.append('applicant_education', formData.applicant_education);
    submitData.append('applicant_experience', formData.applicant_experience);
    
    if (formData.essay) submitData.append('essay', formData.essay);
    if (formData.additional_documents) submitData.append('additional_documents', formData.additional_documents);

    try {
      await axiosInstance.post('/applications/apply/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    }
  };

  const handleCompleteApplication = async (applicationId) => {
    try {
      await axiosInstance.post(`/applications/${applicationId}/complete/`);
      toast.success('Application completed successfully! Congratulations! 🎉');
      fetchData();
    } catch (error) {
      toast.error('Failed to complete application');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-500',
      completed: 'bg-blue-100 text-blue-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Company Link */}
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Student Dashboard</h1>
            <p className="text-gray-500 mt-2">Find and apply for internships and jobs</p>
          </div>
          <Link 
            to="/CompanySide"
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-gray-200 shadow-sm"
          >
            <BuildingOfficeIcon className="h-5 w-5" />
            <span className="font-medium">Company Portal →</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Available Jobs</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{jobs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Applications</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {applications.filter(a => a.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Jobs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Opportunities</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 p-6 border border-gray-200">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-gray-500 mt-1">{job.company || job.manager_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {job.type}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {job.location}
                      </span>
                      {job.salary_range && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {job.salary_range}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                    <div className="mt-3 text-sm text-gray-400 flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(job)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
                <p className="text-gray-500">No jobs available at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* My Applications Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Applications</h2>
          <div className="bg-white/80 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{app.job_details?.title}</div>
                        <div className="text-sm text-gray-500">{app.job_details?.company || app.job_details?.manager_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(app.response_deadline).toLocaleDateString()}
                        {app.is_response_expired && app.status === 'pending' && (
                          <span className="ml-2 text-red-500 text-xs font-medium">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(app.status)}`}>
                          {app.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {app.status === 'accepted' && !app.completed_at && (
                          <button
                            onClick={() => handleCompleteApplication(app.id)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                          >
                            Complete ✓
                          </button>
                        )}
                        {app.status === 'accepted' && app.completed_at && (
                          <span className="text-emerald-600">Completed</span>
                        )}
                        {app.manager_message && app.status === 'accepted' && (
                          <button
                            onClick={() => toast.success(app.manager_message)}
                            className="ml-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                          >
                            View Letter
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        You haven't applied for any jobs yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Apply for {selectedJob.title}</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitApplication} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Letter *</label>
                <textarea
                  name="cover_letter"
                  required
                  rows="4"
                  value={formData.cover_letter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Why are you interested in this position?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Resume/CV *</label>
                <input
                  type="file"
                  name="resume"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
              </div>

              {selectedJob.requires_essay && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Essay *</label>
                  <input
                    type="file"
                    name="essay"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="applicant_email"
                    required
                    value={formData.applicant_email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="applicant_phone"
                    required
                    value={formData.applicant_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
                <textarea
                  name="applicant_education"
                  rows="3"
                  value={formData.applicant_education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your educational background"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Experience</label>
                <textarea
                  name="applicant_experience"
                  rows="3"
                  value={formData.applicant_experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Relevant work experience"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}