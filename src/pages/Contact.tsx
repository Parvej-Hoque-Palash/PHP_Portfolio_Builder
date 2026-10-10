import { motion, AnimatePresence } from 'framer-motion';
import { useForm, ValidationError } from '@formspree/react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import { getIcon } from '../utils/icons';

const Contact = () => {

  const { contact } = usePortfolio().data;

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` },
    { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { icon: MapPin, label: 'Location', value: contact.location, href: '#' },
  ].filter((item) => item.value.trim());

  const socialLinks = contact.socials
    .filter((s) => s.url.trim())
    .map((s) => ({ ...s, icon: getIcon(s.icon) }));

  const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  const socialItemVariants = {
    hidden: { opacity: 0, scale: 0.7, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto mb-12"
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Contact Me
      </motion.h1>

      <div className={`grid grid-cols-1 gap-12 ${contact.formspreeId ? 'lg:grid-cols-2' : 'max-w-2xl'}`}>
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <motion.div
            whileHover={{ y: -3, boxShadow: '0 20px 30px -12px rgba(0,0,0,0.15)' }}
            className="bg-white rounded-xl shadow-lg p-6 space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.span
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.35 }}
                style={{ originY: 0 }}
                className="w-1.5 h-6 bg-purple-600 rounded-full shrink-0"
              />
              <h2 className="text-2xl font-bold text-gray-800">Get in Touch</h2>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {contactInfo.map((item) => (
                <motion.a
                  key={item.label}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  href={item.href}
                  className="flex items-center space-x-4 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <motion.div
                    whileHover={{ rotate: -8, scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                    className="bg-purple-100 p-3 rounded-lg shrink-0"
                  >
                    <item.icon className="text-purple-600" size={20} />
                  </motion.div>
                  <div>
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p>{item.value}</p>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, boxShadow: '0 20px 30px -12px rgba(0,0,0,0.15)' }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                style={{ originY: 0 }}
                className="w-1.5 h-6 bg-purple-600 rounded-full shrink-0"
              />
              <h2 className="text-2xl font-bold text-gray-800">Follow Me</h2>
            </div>
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex space-x-4"
            >
              {socialLinks.map((social) => (
                <motion.a
                  key={social.id}
                  aria-label={social.label}
                  title={social.label}
                  variants={socialItemVariants}
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-100 p-3 rounded-lg text-purple-600 hover:bg-purple-600 hover:text-white transition-colors"
                >
                  <social.icon size={24} />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>


        {/* Contact Form (only when a Formspree form is configured) */}
        {contact.formspreeId && <ContactForm formId={contact.formspreeId} />}
      </div>
    </motion.div>
  );
};

const ContactForm = ({ formId }: { formId: string }) => {
  const [state, handleSubmit] = useForm(formId);

  const fieldVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.4 + i * 0.1, duration: 0.35, ease: 'easeOut' }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.span
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          style={{ originY: 0 }}
          className="w-1.5 h-6 bg-purple-600 rounded-full shrink-0"
        />
        <h2 className="text-2xl font-bold text-gray-800">Send Message</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            id="name"
            type="text"
            name="name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
          />
          <ValidationError prefix="Name" field="name" errors={state.errors} />
        </motion.div>

        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            id="email"
            type="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} />
        </motion.div>

        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Your Message
          </label>
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            id="message"
            name="message"
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} />
        </motion.div>

        <motion.button
          custom={3}
          variants={fieldVariants}
          initial="hidden"
          animate="show"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={state.submitting}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {state.submitting ? 'Sending...' : 'Send Message'}
        </motion.button>

        <AnimatePresence>
          {state.succeeded && (
            <motion.p
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="text-green-600 text-center"
            >
              Thanks for your message!
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
};

export default Contact;