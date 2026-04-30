const patientService = require('../services/patientService');

const sendResult = (res, result, successStatus = 200) => {
  if (result.error) {
    const status = result.error.status || (result.error.code === 'PGRST116' ? 404 : 400);
    return res.status(status).json({ error: result.error.message, code: result.error.code });
  }

  return res.status(successStatus).json(result.data);
};

const getHistory = async (req, res) => {
  const result = await patientService.getPatientHistory(req.params.id, req.userProfile.role);
  return sendResult(res, result);
};

module.exports = { getHistory };
