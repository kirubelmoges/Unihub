import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../static/context';
import axiosInstance from '../static/csrf';
import { BriefcaseIcon, UserGroupIcon, ClockIcon, CheckCircleIcon, PlusIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function InternDashboard() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  
  // Get user role from profile
  const userRole = user?.profile?.student_or_instractor || 'student';
  const isInstructor = userRole === 'instructor';

  // Form states
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

  const [applyForm, setApplyForm] = useState({
    cover_letter: '',
    resume: null,
    essay: null,
    additional_documents: null,
    applicant_email: user?.email || '',
    applicant_phone: user?.profile?.id_no || '',
    applicant_education: '',
    applicant_experience: ''
  });

  const [responseForm, setResponseForm] = useState({
    action: 'accept',
    manager_message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobsRes = await axiosInstance.get('/jobs/');
      setJobs(jobsRes.data);
      
      // Only fetch applications for students
      if (!isInstructor) {
        const appsRes = await axiosInstance.get('/applications/my-applications/');
        setApplications(appsRes.data);
      } else if (selectedJob) {
        const appsRes = await axiosInstance.get(`/applications/job/${selectedJob.id}/`);
        setApplications(appsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (job) => {
    setSelectedJob(job);
    try {
      const response = await axiosInstance.get(`/applications/job/${job.id}/`);
      setApplications(response.data);
      setActiveTab('applications');
    } catch (error) {
      toast.error('Failed to load applications');
    }
  };

  // Job Management Functions
  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/jobs/create/', jobForm);
      toast.success('Job posted successfully!');
      setShowJobModal(false);
      fetchData();
      resetJobForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create job');
    }
  };

  const handleUpdateJobStatus = async (jobId, status) => {
    try {
      await axiosInstance.patch(`/jobs/${jobId}/update/`, { status });
      toast.success(`Job marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axiosInstance.delete(`/jobs/${jobId}/delete/`);
        toast.success('Job deleted successfully');
        fetchData();
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setApplications([]);
        }
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  // Application Functions
  const handleApply = (job) => {
    setSelectedJob(job);
    setApplyForm({
      ...applyForm,
      applicant_email: user?.email || '',
      applicant_phone: user?.profile?.id_no || '',
    });
    setShowApplyModal(true);
  };

  const handleApplyInputChange = (e) => {
    const { name, value } = e.target;
    setApplyForm({ ...applyForm, [name]: value });
  };

  const handleApplyFileChange = (e) => {
    const { name, files } = e.target;
    setApplyForm({ ...applyForm, [name]: files[0] });
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('job', selectedJob.id);
    submitData.append('cover_letter', applyForm.cover_letter);
    submitData.append('resume', applyForm.resume);
    submitData.append('applicant_email', applyForm.applicant_email);
    submitData.append('applicant_phone', applyForm.applicant_phone);
    submitData.append('applicant_education', applyForm.applicant_education);
    submitData.append('applicant_experience', applyForm.applicant_experience);
    
    if (applyForm.essay) submitData.append('essay', applyForm.essay);
    if (applyForm.additional_documents) submitData.append('additional_documents', applyForm.additional_documents);

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

  const handleRespondToApplication = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/applications/${selectedApplication.id}/respond/`, responseForm);
      toast.success(`Application ${responseForm.action}ed successfully!`);
      if (responseForm.action === 'accept') {
        toast.success('Congratulations letter sent to applicant!');
      }
      setShowResponseModal(false);
      fetchJobApplications(selectedJob);
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
      cancelled: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-purple-100 text-purple-700'
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {isInstructor ? 'Company Dashboard' : 'Student Dashboard'}
            </h1>
            <p className="text-gray-500 mt-2">
              {isInstructor 
                ? 'Manage your job postings and review applications' 
                : 'Find and apply for internships and jobs'}
            </p>
          </div>
          {isInstructor && (
            <button
              onClick={() => setShowJobModal(true)}
              className="flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Post New Job
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">
                  {isInstructor ? 'Total Applications' : 'My Applications'}
                </p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {isInstructor 
                    ? jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0)
                    : applications.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {isInstructor 
                    ? applications.filter(a => a.status === 'pending').length
                    : applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed/Accepted</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {isInstructor 
                    ? applications.filter(a => a.status === 'completed').length
                    : applications.filter(a => a.status === 'accepted' || a.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'jobs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {isInstructor ? 'My Jobs' : 'Available Jobs'}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'applications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {isInstructor ? 'Applications Received' : 'My Applications'}
            </button>
          </nav>
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-gray-500 mt-1">{job.location}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.type)}`}>
                        {job.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                      {job.salary_range && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {job.salary_range}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                    <div className="mt-3 text-sm text-gray-400 flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </div>
                    {isInstructor && (
                      <div className="mt-3 text-sm text-indigo-600 font-medium">
                        {job.applications_count || 0} applicant(s)
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    {!isInstructor && job.status === 'active' && new Date(job.application_deadline) > new Date() && (
                      <button
                        onClick={() => handleApply(job)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 text-sm shadow-md transition-all"
                      >
                        Apply Now
                      </button>
                    )}
                    {isInstructor && (
                      <>
                        <button
                          onClick={() => fetchJobApplications(job)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 text-sm transition-all"
                        >
                          View Apps
                        </button>
                        <select
                          onChange={(e) => handleUpdateJobStatus(job.id, e.target.value)}
                          value={job.status}
                          className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white/50 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="active">Active</option>
                          <option value="filled">Filled</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
                <p className="text-gray-500">
                  {isInstructor ? "You haven't posted any jobs yet" : "No jobs available at the moment"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-gray-200">
            {applications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-md font-medium text-gray-800">
                            {isInstructor 
                              ? app.applicant_details?.full_name || app.applicant_details?.username
                              : app.job_details?.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(app.status)}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                        {isInstructor ? (
                          <>
                            <p className="text-sm text-gray-500 mt-1">{app.applicant_email}</p>
                            {app.applicant_phone && (
                              <p className="text-sm text-gray-400">{app.applicant_phone}</p>
                            )}
                            <div className="mt-2 flex space-x-3">
                              <button
                                onClick={() => window.open(app.resume, '_blank')}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                View Resume
                              </button>
                              {app.essay && (
                                <button
                                  onClick={() => window.open(app.essay, '_blank')}
                                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  View Essay
                                </button>
                              )}
                            </div>
                            {app.cover_letter && (
                              <div className="mt-2 text-sm text-gray-500">
                                <strong>Cover Letter:</strong> {app.cover_letter.substring(0, 150)}...
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-500 mt-1">{app.job_details?.location}</p>
                            {app.manager_message && app.status === 'accepted' && (
                              <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <p className="text-sm text-emerald-700">{app.manager_message}</p>
                              </div>
                            )}
                          </>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          Applied: {new Date(app.applied_at).toLocaleDateString()}
                          {app.response_deadline && (
                            <span className="ml-4">
                              Response by: {new Date(app.response_deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {!isInstructor && app.status === 'accepted' && !app.completed_at && (
                          <button
                            onClick={() => handleCompleteApplication(app.id)}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-green-700 text-sm shadow-md transition-all"
                          >
                            Complete ✓
                          </button>
                        )}
                        {isInstructor && app.status === 'pending' && !app.is_response_expired && (
                          <button
                            onClick={() => {
                              setSelectedApplication(app);
                              setResponseForm({ action: 'accept', manager_message: '' });
                              setShowResponseModal(true);
                            }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 text-sm shadow-md transition-all"
                          >
                            Respond
                          </button>
                        )}
                        {app.status === 'completed' && (
                          <span className="text-emerald-600 text-sm font-medium">✓ Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No applications to display
              </div>
            )}
          </div>
        )}

        {/* Create Job Modal - Only for instructors */}
        {showJobModal && isInstructor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Post New Job/Internship</h3>
                <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5" />
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
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    <span className="text-sm text-gray-600">Resume/CV</span>
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={jobForm.requires_essay}
                      onChange={(e) => setJobForm({ ...jobForm, requires_essay: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-600">Essay</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowJobModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                    Post Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Apply Modal - Only for students */}
        {showApplyModal && selectedJob && !isInstructor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Apply for {selectedJob.title}</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitApplication} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Letter *</label>
                  <textarea
                    name="cover_letter"
                    required
                    rows="4"
                    value={applyForm.cover_letter}
                    onChange={handleApplyInputChange}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Resume/CV *</label>
                  <input
                    type="file"
                    name="resume"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleApplyFileChange}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                {selectedJob.requires_essay && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Essay</label>
                    <input
                      type="file"
                      name="essay"
                      accept=".pdf,.doc,.docx"
                      onChange={handleApplyFileChange}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Response Modal - Only for instructors */}
        {showResponseModal && selectedApplication && isInstructor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Respond to Application</h3>
                <button onClick={() => setShowResponseModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5" />
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
                    <option value="accept">✅ Accept - Send Congratulations</option>
                    <option value="reject">❌ Reject</option>
                  </select>
                </div>

                {responseForm.action === 'accept' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Message (Optional)</label>
                    <textarea
                      rows="6"
                      value={responseForm.manager_message}
                      onChange={(e) => setResponseForm({ ...responseForm, manager_message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="Write a personalized message or leave blank for auto-generated congratulations..."
                    />
                    <p className="text-xs text-gray-400 mt-1">If left blank, a standard congratulations letter will be sent</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowResponseModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all">
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
                    {responseForm.action === 'accept' ? 'Accept & Send Letter' : 'Reject'}
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