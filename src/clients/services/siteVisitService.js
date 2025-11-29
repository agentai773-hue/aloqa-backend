const siteVisitRepository = require('../repositories/siteVisitRepository');

class SiteVisitService {
  async createSiteVisit(siteVisitData) {
    try {
      const siteVisit = await siteVisitRepository.create(siteVisitData);
      return {
        success: true,
        data: siteVisit,
        message: 'Site visit scheduled successfully',
      };
    } catch (error) {
      throw new Error(`Error creating site visit: ${error.message}`);
    }
  }

  async getSiteVisitById(id) {
    try {
      const siteVisit = await siteVisitRepository.findById(id);
      if (!siteVisit) {
        throw new Error('Site visit not found');
      }
      return {
        success: true,
        data: siteVisit,
      };
    } catch (error) {
      throw new Error(`Error fetching site visit: ${error.message}`);
    }
  }

  async getSiteVisitsByLeadId(leadId) {
    try {
      const siteVisits = await siteVisitRepository.findByLeadId(leadId);
      return {
        success: true,
        data: siteVisits,
        count: siteVisits.length,
      };
    } catch (error) {
      throw new Error(`Error fetching site visits: ${error.message}`);
    }
  }

  async updateSiteVisit(id, updateData) {
    try {
      const siteVisit = await siteVisitRepository.updateById(id, updateData);
      if (!siteVisit) {
        throw new Error('Site visit not found');
      }
      return {
        success: true,
        data: siteVisit,
        message: 'Site visit updated successfully',
      };
    } catch (error) {
      throw new Error(`Error updating site visit: ${error.message}`);
    }
  }

  async deleteSiteVisit(id) {
    try {
      const siteVisit = await siteVisitRepository.deleteById(id);
      if (!siteVisit) {
        throw new Error('Site visit not found');
      }
      return {
        success: true,
        message: 'Site visit deleted successfully',
      };
    } catch (error) {
      throw new Error(`Error deleting site visit: ${error.message}`);
    }
  }

  async getUpcomingSiteVisits(leadId) {
    try {
      const siteVisits = await siteVisitRepository.findUpcoming(leadId);
      return {
        success: true,
        data: siteVisits,
        count: siteVisits.length,
      };
    } catch (error) {
      throw new Error(`Error fetching upcoming site visits: ${error.message}`);
    }
  }

  async getCompletedSiteVisits(leadId) {
    try {
      const siteVisits = await siteVisitRepository.findCompleted(leadId);
      return {
        success: true,
        data: siteVisits,
        count: siteVisits.length,
      };
    } catch (error) {
      throw new Error(`Error fetching completed site visits: ${error.message}`);
    }
  }

  async extractAndCreateSiteVisit(leadId, callHistoryId, transcript) {
    try {
      // Parse transcript to extract site visit info
      const visitInfo = this.parseTranscriptForSiteVisit(transcript);

      if (!visitInfo) {
        return {
          success: false,
          message: 'No site visit info found in transcript',
        };
      }

      // Check if already exists for this call
      const existing = await siteVisitRepository.findByCallHistoryId(callHistoryId);
      if (existing) {
        return {
          success: false,
          message: 'Site visit already created for this call',
        };
      }

      const siteVisitData = {
        leadId,
        visitDate: visitInfo.visitDate,
        visitTime: visitInfo.visitTime,
        projectName: visitInfo.projectName,
        address: visitInfo.address || '',
        notes: visitInfo.notes || '',
        extractedFromTranscript: true,
        callHistoryId,
        status: 'scheduled',
      };

      const siteVisit = await siteVisitRepository.create(siteVisitData);

      return {
        success: true,
        data: siteVisit,
        message: 'Site visit extracted and created from transcript',
      };
    } catch (error) {
      throw new Error(`Error extracting site visit from transcript: ${error.message}`);
    }
  }

  parseTranscriptForSiteVisit(transcript) {
    try {
      // Convert transcript to string if it's an object/array
      let transcriptText = transcript;
      if (typeof transcript === 'object') {
        if (Array.isArray(transcript)) {
          transcriptText = transcript
            .map((msg) => {
              if (typeof msg === 'string') return msg;
              if (msg.message) return msg.message;
              if (msg.text) return msg.text;
              if (msg.content) return msg.content;
              return JSON.stringify(msg);
            })
            .join('\n');
        } else {
          transcriptText = JSON.stringify(transcript);
        }
      }

      console.log('📄 Parsing transcript for site visit info');
      console.log('📝 Transcript text:', transcriptText.substring(0, 300) + '...');

      let visitDate = null;
      let visitTime = null;
      let projectName = null;
      let address = null;

      // ============ EXTRACT DATE ============
      // 1. Try to find numeric month + day in words (e.g., "twenty nine november")
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december',
                         'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
                         'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
      
      const wordToNumber = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
        'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
        'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
        'nineteen': 19, 'twenty': 20, 'twenty one': 21, 'twenty-one': 21, 'twenty two': 22,
        'twenty-two': 22, 'twenty three': 23, 'twenty-three': 23, 'twenty four': 24,
        'twenty-four': 24, 'twenty five': 25, 'twenty-five': 25, 'twenty six': 26,
        'twenty-six': 26, 'twenty seven': 27, 'twenty-seven': 27, 'twenty eight': 28,
        'twenty-eight': 28, 'twenty nine': 29, 'twenty-nine': 29, 'thirty': 30,
        'thirty one': 31, 'thirty-one': 31
      };

      for (const month of monthNames) {
        if (transcriptText.toLowerCase().includes(month)) {
          // Found month name, now look for day number in words
          const monthRegex = new RegExp(`(${Object.keys(wordToNumber).join('|')})\\s+${month}`, 'i');
          const dateMatch = transcriptText.match(monthRegex);
          
          if (dateMatch) {
            const dayWord = dateMatch[1].toLowerCase();
            const dayNum = wordToNumber[dayWord];
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
            const realMonthIndex = monthIndex % 12; // Handle Hindi months (skip first 12)
            
            if (dayNum && realMonthIndex !== -1) {
              const today = new Date();
              const currentYear = today.getFullYear();
              let targetDate = new Date(currentYear, realMonthIndex, dayNum);
              
              // If date is in the past, try next year
              if (targetDate < today) {
                targetDate = new Date(currentYear + 1, realMonthIndex, dayNum);
              }
              
              visitDate = targetDate;
              console.log('✅ Found word-form date:', dayWord, month, '->', visitDate);
              break;
            }
          }
        }
      }

      // 2. Look for day names (e.g., "Friday")
      if (!visitDate) {
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                         'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'];
        
        for (const day of dayNames) {
          if (transcriptText.toLowerCase().includes(day.toLowerCase())) {
            const englishDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayIndex = englishDays.indexOf(day.toLowerCase());
            
            if (dayIndex !== -1) {
              const today = new Date();
              const currentDayIndex = today.getDay();
              let daysToAdd = dayIndex - currentDayIndex;
              if (daysToAdd <= 0) daysToAdd += 7; // Next week if day already passed
              
              visitDate = new Date(today);
              visitDate.setDate(visitDate.getDate() + daysToAdd);
              console.log('✅ Found day name:', day, '->', visitDate);
              break;
            }
          }
        }
      }

      // 3. Try numeric date patterns
      if (!visitDate) {
        const datePatterns = [
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // DD/MM/YYYY or MM/DD/YYYY
          /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,    // YYYY/MM/DD
        ];

        for (const pattern of datePatterns) {
          const dateMatch = transcriptText.match(pattern);
          if (dateMatch) {
            try {
              const parsed = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
              if (!isNaN(parsed.getTime()) && parsed > new Date()) {
                visitDate = parsed;
                console.log('✅ Found numeric date:', dateMatch[0], '->', visitDate);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      // ============ EXTRACT TIME ============
      // 1. Try word-form times first (e.g., "two pm", "five pm")
      const timeWordMap = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
        'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12
      };

      for (const [word, hour] of Object.entries(timeWordMap)) {
        const wordTimeRegex = new RegExp(`${word}\\s*(?:PM|pm|AM|am|o'clock)?`, 'i');
        if (wordTimeRegex.test(transcriptText)) {
          // Check if PM is mentioned nearby
          const context = transcriptText.toLowerCase();
          const wordIndex = context.indexOf(word);
          const nearbyText = context.substring(Math.max(0, wordIndex - 20), wordIndex + 20);
          
          if (nearbyText.includes('pm')) {
            visitTime = `${String(hour + 12).padStart(2, '0')}:00`; // Convert to 24-hour
            console.log('✅ Found word-form PM time:', word, 'PM', '->', visitTime);
            break;
          } else if (nearbyText.includes('am') || word === 'one' || word === 'two') {
            visitTime = `${String(hour).padStart(2, '0')}:00`;
            console.log('✅ Found word-form AM time:', word, 'AM', '->', visitTime);
            break;
          }
        }
      }

      // 2. Try numeric times (e.g., "2 PM", "14:00")
      if (!visitTime) {
        const timePatterns = [
          /(\d{1,2})\s*(?:PM|pm)\b/,                    // "2 PM"
          /(\d{1,2})\s*(?:AM|am)\b/,                    // "2 AM"
          /(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?/,       // "14:00" or "2:00 PM"
          /(?:at|@)\s*(\d{1,2}):(\d{2})/,               // "at 14:00"
        ];

        for (const pattern of timePatterns) {
          const timeMatch = transcriptText.match(pattern);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            
            // Check if PM mentioned
            const fullMatch = timeMatch[0];
            if (fullMatch.includes('PM') || fullMatch.includes('pm')) {
              if (hour < 12) hour += 12;
            } else if (fullMatch.includes('AM') || fullMatch.includes('am')) {
              if (hour === 12) hour = 0;
            }
            
            visitTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            console.log('✅ Found numeric time:', fullMatch, '->', visitTime);
            break;
          }
        }
      }

      // ============ EXTRACT PROJECT NAME ============
      // Look for specific project keywords
      const projectKeywords = ['shilp serene', 'shilp revanta', 'shilp reserve', 'shilp gardens',
                             'property', 'project', 'apartment', 'villa', 'flat', 'house'];
      
      for (const keyword of projectKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(transcriptText)) {
          projectName = keyword
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          console.log('✅ Found project keyword:', projectName);
          break;
        }
      }

      // ============ EXTRACT ADDRESS ============
      // Look for location patterns
      const addressPatterns = [
        /(?:at|in|location|ring road|road)\s+([a-zA-Z\s,]+?)(?:\.|,|$)/i,
        /(?:near|close to|area)\s+([a-zA-Z\s]+?)(?:\.|,|$)/i,
      ];

      for (const pattern of addressPatterns) {
        const addressMatch = transcriptText.match(pattern);
        if (addressMatch && addressMatch[1]) {
          address = addressMatch[1].trim().substring(0, 100);
          console.log('✅ Found address:', address);
          break;
        }
      }

      // ============ VALIDATE AND RETURN ============
      // Need at least time + project, date is optional (will default to tomorrow)
      if (!visitTime || !projectName) {
        console.log(
          '❌ Incomplete site visit info:',
          { hasDate: !!visitDate, hasTime: !!visitTime, hasProject: !!projectName }
        );
        return null;
      }

      // Smart defaults for missing data
      if (!visitDate) {
        visitDate = new Date();
        visitDate.setDate(visitDate.getDate() + 1); // Default to tomorrow
        console.log('⚠️ No date found, using tomorrow as default:', visitDate);
      }

      console.log('✅ Site visit info found - creating record');
      return {
        visitDate,
        visitTime: this.normalizeTime(visitTime),
        projectName,
        address: address || 'Not specified',
        notes: 'Extracted from call transcript',
      };
    } catch (error) {
      console.error('Error parsing transcript for site visit:', error);
      return null;
    }
  }

  normalizeTime(time) {
    // Convert to HH:MM format
    const match = time.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = parseInt(match[1]).toString().padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }
    return time;
  }
}

module.exports = new SiteVisitService();
