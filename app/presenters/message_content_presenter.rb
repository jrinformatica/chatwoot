class MessageContentPresenter < SimpleDelegator
  def outgoing_content
    base_content = content_with_survey_link
    return base_content unless should_prepend_sender_name?

    "#{sender_name}:\n#{base_content}"
  end

  private

  def content_with_survey_link
    return content unless should_append_survey_link?

    survey_link = survey_url(conversation.uuid)
    custom_message = inbox.csat_config&.dig('message')

    custom_message.present? ? "#{custom_message} #{survey_link}" : I18n.t('conversations.survey.response', link: survey_link)
  end

  def should_prepend_sender_name?
    outgoing? && sender.present? && !sender.is_a?(AgentBot)
  end

  def sender_name
    sender.available_name || sender.name
  end

  def should_append_survey_link?
    input_csat? && !inbox.web_widget?
  end

  def survey_url(conversation_uuid)
    "#{ENV.fetch('FRONTEND_URL', nil)}/survey/responses/#{conversation_uuid}"
  end
end
