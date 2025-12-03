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

      // ============ FIRST CHECK: SITE VISIT KEYWORDS ============
      // Only proceed if user mentioned visiting/site visit/viewing property
      const visitKeywords = [
        'visit',
        'site visit',
        'site check',
        'dekhne',
        'dekh',
        'dekho',
        'sample flat',
        'showroom',
        'come',
        'आना',
        'आओ',
        'देखना',
        'देख',
        'देखो',
        'आईये',
        'मिलना',
        'मिल',
        'meeting',
        'appointment',
        'schedule',
        'book',
        'confirm',
        'yes visit',
        'definitely visit',
        'sure visit',
      ];

      const transcriptLower = transcriptText.toLowerCase();
      const hasVisitMention = visitKeywords.some(keyword => transcriptLower.includes(keyword));

      if (!hasVisitMention) {
        console.log('⚠️  No site visit keywords found in transcript - skipping site visit extraction');
        return null;
      }

      console.log('✅ Site visit keywords found - attempting to extract date and time');

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

      // 2. Look for day names (e.g., "Friday", "Thursday")
      if (!visitDate) {
        const englishDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                         'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'];
        
        const hindiToEnglish = {
          'सोमवार': 'monday', 'मंगलवार': 'tuesday', 'बुधवार': 'wednesday', 'गुरुवार': 'thursday',
          'शुक्रवार': 'friday', 'शनिवार': 'saturday', 'रविवार': 'sunday'
        };
        
        const transcriptLowerForDayMatch = transcriptText.toLowerCase();
        console.log('🔍 Looking for day names in transcript:', transcriptLowerForDayMatch.substring(0, 200));
        
        for (const day of dayNames) {
          const dayLower = day.toLowerCase();
          if (transcriptLowerForDayMatch.includes(dayLower)) {
            console.log('   ✅ Found day keyword:', dayLower);
            
            // Map to English day name
            let englishDay = dayLower;
            if (hindiToEnglish[dayLower]) {
              englishDay = hindiToEnglish[dayLower];
            }
            
            const dayIndex = englishDays.indexOf(englishDay);
            console.log('   Day index in array:', dayIndex, '(englishDay=' + englishDay + ')');
            
            if (dayIndex !== -1) {
              const today = new Date();
              const currentDayIndex = today.getDay();
              console.log('   Today is index:', currentDayIndex, '(0=Sun, 1=Mon, etc)');
              
              let daysToAdd = dayIndex - currentDayIndex;
              console.log('   Initial daysToAdd:', daysToAdd);
              
              // If day is in the past or today, get next week's occurrence
              if (daysToAdd < 0) {
                daysToAdd += 7;
              } else if (daysToAdd === 0) {
                // If it's today, schedule for next week (7 days later)
                daysToAdd = 7;
              }
              
              console.log('   Final daysToAdd:', daysToAdd);
              
              visitDate = new Date(today);
              visitDate.setDate(visitDate.getDate() + daysToAdd);
              console.log('✅ Found day name:', day, '-> Next occurrence:', visitDate.toDateString());
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
      console.log('\n🕐 TIME EXTRACTION DEBUG:');
      console.log('Looking for time patterns in transcript...');
      
      // 1. Try numeric times FIRST with explicit PM/AM (e.g., "4 PM", "2:30 AM")
      if (!visitTime) {
        const numericTimePatterns = [
          /(\d{1,2}):(\d{2})\s*(?:PM|pm)/,              // "14:30 PM" or "2:30 PM"
          /(\d{1,2}):(\d{2})\s*(?:AM|am)/,              // "9:30 AM"
          /(\d{1,2})\s+(?:PM|pm)\b/,                    // "4 PM" (space before PM)
          /(\d{1,2})(?:PM|pm)\b/,                       // "4PM" (no space before PM)
          /(\d{1,2})\s+(?:AM|am)\b/,                    // "9 AM"
          /(\d{1,2})(?:AM|am)\b/,                       // "9AM"
        ];

        for (const pattern of numericTimePatterns) {
          const timeMatch = transcriptText.match(pattern);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            
            // Check if PM mentioned
            const fullMatch = timeMatch[0].toLowerCase();
            if (fullMatch.includes('pm')) {
              if (hour < 12 && hour !== 12) hour += 12;
            } else if (fullMatch.includes('am')) {
              if (hour === 12) hour = 0;
            }
            
            visitTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            console.log('   ✅ MATCHED numeric pattern:', timeMatch[0], '-> Time:', visitTime);
            break;
          } else {
            console.log('   ⚠️  Pattern did not match:', pattern.toString());
          }
        }
      }

      // 2. Try word-form times with PM/AM (e.g., "four pm", "two am")
      // This needs to be MORE SPECIFIC to match the EXACT time in transcript
      if (!visitTime) {
        console.log('\n   Trying word-form times...');
        const timeWordMap = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
          'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12
        };

        // Create a single regex that captures both the word AND the period
        // This prevents matching "two" when the text says "three"
        // Matches patterns like: "three pm", "3 pm", "three PM", "teen bajey"
        const timePattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24)\s*(?:pm|p\.m|PM|P\.M|am|a\.m|AM|A\.M)/gi;
        
        let match;
        let allMatches = [];
        while ((match = timePattern.exec(transcriptText)) !== null) {
          allMatches.push({
            matched: match[0],
            hour: isNaN(match[1]) ? timeWordMap[match[1].toLowerCase()] || null : parseInt(match[1]),
            period: match[0].toLowerCase().includes('am') || match[0].toLowerCase().includes('a.m') ? 'AM' : 'PM',
            index: match.index
          });
        }

        // If we found matches, use the FIRST (most likely) one
        if (allMatches.length > 0) {
          const firstMatch = allMatches[0];
          let hour = firstMatch.hour;
          
          if (hour === null) {
            console.log('   ⚠️  Could not parse hour from match:', firstMatch.matched);
          } else {
            // Convert to 24-hour format
            if (firstMatch.period === 'PM' && hour !== 12) {
              hour += 12;
            } else if (firstMatch.period === 'AM' && hour === 12) {
              hour = 0;
            }
            
            visitTime = `${String(hour).padStart(2, '0')}:00`;
            console.log('   ✅ MATCHED word-form time pattern:', firstMatch.matched, '-> Hour:', hour, '-> Time:', visitTime);
          }
        }
      }

      if (visitTime) {
        console.log('\n🕐 Final extracted time:', visitTime);
      } else {
        console.log('\n❌ NO TIME EXTRACTED - Will fail site visit creation');
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
      // Must have: time + projectName + date
      // Without these, we cannot create a valid site visit
      if (!visitDate) {
        console.log('❌ No valid date extracted from transcript - skipping site visit creation');
        return null;
      }

      if (!visitTime) {
        console.log('❌ No valid time extracted from transcript - skipping site visit creation');
        return null;
      }

      if (!projectName) {
        console.log('❌ No project name found in transcript - skipping site visit creation');
        return null;
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
