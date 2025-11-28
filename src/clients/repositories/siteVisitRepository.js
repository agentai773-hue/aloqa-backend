const SiteVisit = require('../../models/SiteVisit');

class SiteVisitRepository {
  async create(siteVisitData) {
    const siteVisit = new SiteVisit(siteVisitData);
    return await siteVisit.save();
  }

  async findById(id) {
    return await SiteVisit.findById(id).populate('leadId');
  }

  async findByLeadId(leadId) {
    return await SiteVisit.find({ leadId })
      .populate('leadId')
      .sort({ visitDate: -1 });
  }

  async findAll(filters = {}) {
    return await SiteVisit.find(filters)
      .populate('leadId')
      .sort({ visitDate: -1 });
  }

  async updateById(id, updateData) {
    return await SiteVisit.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteById(id) {
    return await SiteVisit.findByIdAndDelete(id);
  }

  async findByCallHistoryId(callHistoryId) {
    return await SiteVisit.findOne({ callHistoryId });
  }

  async findUpcoming(leadId) {
    return await SiteVisit.find({
      leadId,
      visitDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'rescheduled'] },
    }).sort({ visitDate: 1 });
  }

  async findCompleted(leadId) {
    return await SiteVisit.find({
      leadId,
      status: 'completed',
    }).sort({ visitDate: -1 });
  }
}

module.exports = new SiteVisitRepository();
