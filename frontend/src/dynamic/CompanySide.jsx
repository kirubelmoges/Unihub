import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../static/context';
import axiosInstance from '../static/csrf';
import { BriefcaseIcon, UserGroupIcon, ClockIcon, CheckCircleIcon, PlusIcon, EyeIcon, MailIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CompanySide() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    type: 'internship',
    location: '',
    salary_range: '',
    requires_resume: true,
    requires_essay: false,
    requires_additional_docs: false,
    application_deadline: '',
    response_deadline_days: 7
  });
  const [responseForm, setResponseForm] = useState({
    action: 'accept',
    manager_message: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // ✅ FIXED: Added /api/ prefix
      const response = await axiosInstance.get('/api/jobs/');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    try {
      // ✅ FIXED: Added /api/ prefix
      const response = await axiosInstance.get(`/api/applications/job/${jobId}/`);
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to load applications');
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    await fetchApplications(job.id);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      // ✅ FIXED: Added /api/ prefix
      await axiosInstance.post('/api/jobs/create/', jobForm);
      toast.success('Job posted successfully!');
      setShowJobModal(false);
      fetchJobs();
      resetJobForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create job');
    }
  };

  const handleUpdateJobStatus = async (jobId, status) => {
    try {
      // ✅ FIXED: Added /api/ prefix
      await axiosInstance.patch(`/api/jobs/${jobId}/update/`, { status });
      toast.success(`Job marked as ${status}`);
      fetchJobs();
      if (selectedJob?.id === jobId) {
        setSelectedJob({ ...selectedJob, status });
      }
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const handleRespondToApplication = async (e) => {
    e.preventDefault();
    try {
      // ✅ FIXED: Added /api/ prefix
      await axiosInstance.post(`/api/applications/${selectedApplication.id}/respond/`, responseForm);
      toast.success(`Application ${responseForm.action}ed successfully!`);
      if (responseForm.action === 'accept') {
        toast.success('Congratulations letter sent to applicant!');
      }
      setShowResponseModal(false);
      fetchApplications(selectedJob.id);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to respond to application');
    }
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      description: '',
      requirements: '',
      type: 'internship',
      location: '',
      salary_range: '',
      requires_resume: true,
      requires_essay: false,
      requires_additional_docs: false,
      application_deadline: '',
      response_deadline_days: 7
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-emerald-100 text-emerald-700',
      expired: 'bg-gray-100 text-gray-600',
      filled: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-600';
  };

  const getAppStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-600',
      completed: 'bg-blue-100 text-blue-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Link */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/StudentSide"
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Student Portal</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Company Dashboard</h1>
              <p className="text-gray-500 mt-2">Manage your job postings and applications</p>
            </div>
          </div>
          <button
            onClick={() => setShowJobModal(true)}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Post New Job
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{jobs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {applications.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden border border-gray-200">
              <div className="px-6 py-4 bg-white/50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Your Job Postings</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`px-6 py-4 cursor-pointer transition-all duration-300 ${
                      selectedJob?.id === job.id 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                        <div className="flex items-center mt-2 gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                            {job.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {job.applications_count || 0} applicants
                          </span>
                        </div>
                      </div>
                      {job.is_expired && job.status === 'active' && (
                        <span className="text-xs text-red-500 font-medium">Expired</span>
                      )}
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500">
                    No jobs posted yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="bg-white/80 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-white/50 border-b border-gray-200">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Applications for <span className="text-indigo-600">{selectedJob.title}</span>
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Deadline: {new Date(selectedJob.application_deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <select
                        onChange={(e) => handleUpdateJobStatus(selectedJob.id, e.target.value)}
                        value={selectedJob.status}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/50 backdrop-blur-sm focus:border-indigo-400 focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="filled">Filled</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <div key={app.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-md font-semibold text-gray-800">
                              {app.applicant_details?.full_name || app.applicant_details?.username}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getAppStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{app.applicant_email}</p>
                          {app.applicant_phone && (
                            <p className="text-sm text-gray-400">{app.applicant_phone}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setResponseForm({
                                  action: 'accept',
                                  manager_message: ''
                                });
                                setShowResponseModal(true);
                              }}
                              disabled={app.status !== 'pending' || app.is_response_expired}
                              className={`text-sm px-4 py-1.5 rounded-xl transition-all ${
                                app.status === 'pending' && !app.is_response_expired
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Respond
                            </button>
                            {app.resume && (
                              <button
                                onClick={() => window.open(app.resume, '_blank')}
                                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-indigo-50"
                              >
                                View Resume
                              </button>
                            )}
                            {app.essay && (
                              <button
                                onClick={() => window.open(app.essay, '_blank')}
                                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-indigo-50"
                              >
                                View Essay
                              </button>
                            )}
                          </div>
                          {app.cover_letter && (
                            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                              <strong className="text-gray-700">Cover Letter:</strong> {app.cover_letter.substring(0, 100)}...
                            </div>
                          )}
                          {app.is_response_expired && app.status === 'pending' && (
                            <p className="mt-2 text-xs text-red-500 font-medium">Response deadline has passed</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          Applied: {new Date(app.applied_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <div className="px-6 py-12 text-center text-gray-500">
                      No applications received yet
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm shadow-md rounded-2xl p-12 text-center border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BriefcaseIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">No Job Selected</h3>
                <p className="text-gray-500 mt-2">Select a job from the list to view applications</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Job Modal */}
        {showJobModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Post New Job/Internship</h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateJob} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="e.g., Frontend Developer Intern"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      value={jobForm.type}
                      onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="internship">Internship</option>
                      <option value="job">Full-Time Job</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="City, Country or Remote"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={jobForm.salary_range}
                    onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., $50,000 - $70,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows="4"
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Job description, responsibilities, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Requirements *</label>
                  <textarea
                    required
                    rows="4"
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Required skills, qualifications, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Application Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={jobForm.application_deadline}
                      onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Response Deadline (Days)</label>
                    <input
                      type="number"
                      value={jobForm.response_deadline_days}
                      onChange={(e) => setJobForm({ ...jobForm, response_deadline_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-400 mt-1">Days to respond to applications after submission</p>
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700">Required Documents</label>
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={jobForm.requires_resume}
                      onChange={(e) => setJobForm({ ...jobForm, requires_resume: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-600">Resume/CV (Required by default)</span>
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={jobForm.requires_essay}
                      onChange={(e) => setJobForm({ ...jobForm, requires_essay: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-600">Essay/Cover Letter</span>
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={jobForm.requires_additional_docs}
                      onChange={(e) => setJobForm({ ...jobForm, requires_additional_docs: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-600">Additional Documents</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    Post Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Respond to Application
                </h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleRespondToApplication} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Action *</label>
                  <select
                    required
                    value={responseForm.action}
                    onChange={(e) => setResponseForm({ ...responseForm, action: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="accept">✅ Accept - Send Congratulations Letter</option>
                    <option value="reject">❌ Reject</option>
                  </select>
                </div>

                {responseForm.action === 'accept' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      rows="6"
                      value={responseForm.manager_message}
                      onChange={(e) => setResponseForm({ ...responseForm, manager_message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="Write a personalized acceptance letter or leave blank for auto-generated congratulations letter..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      If left blank, a standard congratulations letter will be sent
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl text-white font-semibold transition-all shadow-md ${
                      responseForm.action === 'accept'
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                    }`}
                  >
                    {responseForm.action === 'accept' ? 'Accept & Send Letter' : 'Reject Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}